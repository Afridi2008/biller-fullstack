"""
BILLER - Full FastAPI Backend Application
Tech Stack: React JS (Frontend) + Python 3.10 + FastAPI (REST API Engine) + MongoDB (Atlas/Live Database).
"""
import os
import time
import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from .models import (
    BillModel, 
    ProductModel, 
    CustomerModel, 
    PaymentRecordModel, 
    ShopSettingsModel
)
from .database import db_manager
from .routes import customers, products, bills, payments, auth


# FastAPI App Configuration
app = FastAPI(
    title="BILLER API - Flex Print Business Management",
    description="Full-stack FastAPI & Python backend with MongoDB database integration, Pydantic validation, and high-performance financial analytics.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(customers.router)
app.include_router(products.router)
app.include_router(bills.router)
app.include_router(payments.router)
app.include_router(auth.router)
# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Request & Response Models
# ----------------------------------------------------
class MongoConfigRequest(BaseModel):
    uri: str = Field(..., description="MongoDB Connection URI (Atlas or local)")
    dbName: Optional[str] = "biller_db"

class SyncPayload(BaseModel):
    bills: Optional[List[Dict[str, Any]]] = []
    products: Optional[List[Dict[str, Any]]] = []
    customers: Optional[List[Dict[str, Any]]] = []
    payments: Optional[List[Dict[str, Any]]] = []
    settings: Optional[Dict[str, Any]] = None

class AnalyticsPayload(BaseModel):
    bills: Optional[List[Dict[str, Any]]] = []
    payments: Optional[List[Dict[str, Any]]] = []

class BillValidationPayload(BaseModel):
    bill: Dict[str, Any]

# Realtime SSE client queue
realtime_subscribers = []

# ----------------------------------------------------
# Health & Tech Stack Inspection
# ----------------------------------------------------
@app.get("/api/health", summary="System Health & Tech Stack Info")
async def health_check():
    db_status = db_manager.get_status()
    return {
        "status": "ok",
        "tech_stack": {
            "frontend": "React JS + Vite",
            "backend": "Python 3.10 + FastAPI (High Performance ASGI)",
            "database": "MongoDB (PyMongo + Motor Driver)",
            "validation": "Pydantic V2"
        },
        "fastapi_version": "0.110+",
        "mongo_status": db_status,
        "server_time": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
    }
# ----------------------------------------------------
# MongoDB Database Endpoints
# ----------------------------------------------------
@app.get("/api/db/status", summary="MongoDB Database Connection Status")
async def get_db_status():
    return db_manager.get_status()


@app.post("/api/db/config", summary="Connect to MongoDB URI / Atlas Cluster")
async def configure_mongodb(config: MongoConfigRequest):
    result = db_manager.connect(config.uri, config.dbName or "biller_db")
    return result


@app.get("/api/db/sync", summary="Pull All Collections from MongoDB")
async def pull_sync_data():
    return db_manager.get_all_data()


@app.get("/api/db/data", summary="Load All Database Data")
async def get_db_data():
    return db_manager.get_all_data()


@app.post("/api/db/sync", summary="Push / Batch Sync Collections to MongoDB")
async def push_sync_data(payload: SyncPayload):
    result = db_manager.sync_all_data(payload.model_dump())
    return result

# ----------------------------------------------------
# Python Analytical Engine
# ----------------------------------------------------
@app.post("/api/python/analytics", summary="Python Financial & Square Footage Analytics")
async def run_analytics(payload: AnalyticsPayload):
    bills = payload.bills or []
    payments = payload.payments or []

    total_revenue = sum(float(b.get("totalAmount", 0) or 0) for b in bills)
    total_collected = sum(float(b.get("advancePaid", 0) or 0) for b in bills)
    pending_amount = sum(float(b.get("balanceDue", 0) or 0) for b in bills)

    total_sqft = 0.0
    total_cost = 0.0

    for b in bills:
        for item in b.get("items", []):
            w = float(item.get("width", 0) or 0)
            h = float(item.get("height", 0) or 0)
            qty = int(item.get("quantity", 1) or 1)
            cost_rate = float(item.get("costRate", 0) or 0)

            if item.get("productType") == "area":
                item_sqft = w * h * qty
                total_sqft += item_sqft
                total_cost += item_sqft * cost_rate
            else:
                total_cost += qty * cost_rate

    net_profit = total_revenue - total_cost

    upi_total = sum(float(p.get("amount", 0) or 0) for p in payments if p.get("method") == "UPI")
    cash_total = sum(float(p.get("amount", 0) or 0) for p in payments if p.get("method") == "Cash")
    card_total = sum(float(p.get("amount", 0) or 0) for p in payments if p.get("method") == "Card")
    bank_total = sum(float(p.get("amount", 0) or 0) for p in payments if p.get("method") == "Bank Tx")

    return {
        "status": "ok",
        "calculatedBy": "FastAPI + Python 3.10 Analytics Engine",
        "totalRevenue": round(total_revenue, 2),
        "totalCollected": round(total_collected, 2),
        "pendingAmount": round(pending_amount, 2),
        "totalSqftPrinted": round(total_sqft, 2),
        "estimatedCost": round(total_cost, 2),
        "netProfit": round(net_profit, 2),
        "profitMarginPercent": round((net_profit / total_revenue * 100) if total_revenue > 0 else 0, 1),
        "paymentsByMethod": {
            "UPI": upi_total,
            "Cash": cash_total,
            "Card": card_total,
            "BankTx": bank_total
        },
        "timestamp": time.time()
    }

# ----------------------------------------------------
# Bill Validator Endpoint
# ----------------------------------------------------
@app.post("/api/python/validate-bill", summary="Validate Bill Integrity with Pydantic")
async def validate_bill(payload: BillValidationPayload):
    bill = payload.bill
    errors = []
    
    items = bill.get("items", [])
    if not items:
        errors.append("Bill must contain at least one line item.")

    for idx, item in enumerate(items):
        if item.get("productType") == "area":
            w = float(item.get("width", 0) or 0)
            h = float(item.get("height", 0) or 0)
            if w <= 0 or h <= 0:
                errors.append(f"Line #{idx+1} ({item.get('productName')}) has invalid dimension {w}x{h} ft.")

    return {
        "status": "ok" if len(errors) == 0 else "error",
        "validated": len(errors) == 0,
        "errors": errors,
        "engine": "FastAPI & Python 3.10"
    }

# ----------------------------------------------------
# Realtime Server-Sent Events (SSE) Stream
# ----------------------------------------------------
@app.get("/api/realtime/stream", summary="Real-time SSE Stream for MongoDB changes")
async def sse_event_stream(request: Request):
    async def event_generator():
        yield f"event: connected\ndata: {json.dumps({'connected': True, 'engine': 'FastAPI + Python', 'mongoStatus': db_manager.get_status()['status']})}\n\n"
        while True:
            if await request.is_disconnected():
                break
            await asyncio.sleep(15)
            # Periodic heartbeat
            yield f"event: heartbeat\ndata: {json.dumps({'time': time.time(), 'status': db_manager.get_status()['status']})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
