from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..database import db_manager
from ..models import BillModel


router = APIRouter(
    prefix="/api/bills",
    tags=["Bills"]
)


def get_bills_collection():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB database is currently unavailable"
        )

    return db_manager.db["bills"]


@router.post("/", status_code=201)
async def create_bill(bill: BillModel):
    collection = get_bills_collection()

    # Prevent duplicate bill IDs
    existing_id = collection.find_one({
        "id": bill.id
    })

    if existing_id:
        raise HTTPException(
            status_code=409,
            detail="Bill with this ID already exists"
        )

    # Prevent duplicate invoice numbers
    existing_invoice = collection.find_one({
        "invoiceNumber": bill.invoiceNumber
    })

    if existing_invoice:
        raise HTTPException(
            status_code=409,
            detail="Invoice number already exists"
        )

    bill_data = bill.model_dump()

    now = datetime.now(timezone.utc).isoformat()

    if not bill_data.get("createdAt"):
        bill_data["createdAt"] = now

    bill_data["updatedAt"] = now

    collection.insert_one(bill_data)

    bill_data.pop("_id", None)

    return {
        "success": True,
        "message": "Bill created successfully",
        "bill": bill_data
    }


@router.get("/")
async def get_bills():
    collection = get_bills_collection()

    bills = list(
        collection.find(
            {},
            {"_id": 0}
        ).sort("date", -1)
    )

    return {
        "success": True,
        "count": len(bills),
        "bills": bills
    }


@router.get("/{bill_id}")
async def get_bill(bill_id: str):
    collection = get_bills_collection()

    bill = collection.find_one(
        {"id": bill_id},
        {"_id": 0}
    )

    if not bill:
        raise HTTPException(
            status_code=404,
            detail="Bill not found"
        )

    return {
        "success": True,
        "bill": bill
    }


@router.put("/{bill_id}")
async def update_bill(
    bill_id: str,
    bill: BillModel
):
    collection = get_bills_collection()

    existing = collection.find_one({
        "id": bill_id
    })

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Bill not found"
        )

    # Don't allow changing the internal bill ID
    bill_data = bill.model_dump()
    bill_data["id"] = bill_id

    # Prevent invoice number collision with another bill
    invoice_owner = collection.find_one({
        "invoiceNumber": bill.invoiceNumber,
        "id": {"$ne": bill_id}
    })

    if invoice_owner:
        raise HTTPException(
            status_code=409,
            detail="Invoice number already exists"
        )

    bill_data["updatedAt"] = (
        datetime.now(timezone.utc).isoformat()
    )

    collection.update_one(
        {"id": bill_id},
        {"$set": bill_data}
    )

    updated_bill = collection.find_one(
        {"id": bill_id},
        {"_id": 0}
    )

    return {
        "success": True,
        "message": "Bill updated successfully",
        "bill": updated_bill
    }


@router.delete("/{bill_id}")
async def delete_bill(bill_id: str):
    collection = get_bills_collection()

    result = collection.delete_one({
        "id": bill_id
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Bill not found"
        )

    return {
        "success": True,
        "message": "Bill deleted successfully"
    }