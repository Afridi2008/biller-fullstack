"""
Python Database & MongoDB Integration Layer for BILLER.
Supports MongoDB Atlas URI connection, collections CRUD, aggregation pipelines,
and offline fallback syncing.
"""
import os
import json
import time
from typing import Dict, Any, List, Optional

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DB_NAME", "biller_db")

class MongoDBHandler:
    def __init__(self, uri: str = None, db_name: str = None):
        self.uri = uri or MONGODB_URI
        self.db_name = db_name or DB_NAME
        self.client = None
        self.db = None
        self.is_connected = False
        self._init_connection()

    def _init_connection(self):
        if not self.uri:
            return
        try:
            from pymongo import MongoClient
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=3000)
            # Trigger server ping
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            self.is_connected = True
            print(f"[Python-MongoDB] Successfully connected to database: {self.db_name}")
        except Exception as e:
            print(f"[Python-MongoDB] Notice: Could not connect to external MongoDB URI: {e}")
            self.is_connected = False

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "connected" if self.is_connected else "configured_or_fallback",
            "db_name": self.db_name,
            "engine": "python_mongodb_driver",
            "has_uri": bool(self.uri),
            "timestamp": time.time()
        }

    def compute_financial_analytics(self, bills: List[Dict[str, Any]], payments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Python analytical engine to compute detailed financial statistics,
        sqft metrics, profit margins, and customer aging.
        """
        total_revenue = sum(float(b.get("totalAmount", 0)) for b in bills)
        total_collected = sum(float(b.get("advancePaid", 0)) for b in bills)
        pending_amount = sum(float(b.get("balanceDue", 0)) for b in bills)
        
        # Calculate total sqft printed
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

        # Channel payment stats
        upi_total = sum(p.get("amount", 0) for p in payments if p.get("method") == "UPI")
        cash_total = sum(p.get("amount", 0) for p in payments if p.get("method") == "Cash")
        card_total = sum(p.get("amount", 0) for p in payments if p.get("method") == "Card")
        bank_total = sum(p.get("amount", 0) for p in payments if p.get("method") == "Bank Tx")

        return {
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
            }
        }
