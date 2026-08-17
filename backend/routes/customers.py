from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..database import db_manager
from ..models import CustomerModel


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"]
)


# =========================================================
# COLLECTION
# =========================================================

def get_customers_collection():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB database is currently unavailable"
        )

    return db_manager.db["customers"]


def get_bills_collection():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB database is currently unavailable"
        )

    return db_manager.db["bills"]


def get_payments_collection():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB database is currently unavailable"
        )

    return db_manager.db["payments"]


# =========================================================
# CUSTOMER FINANCIAL SYNCHRONIZATION
# =========================================================

def recalculate_customer_financials(customer_id: str):
    """
    Recalculate customer financial information directly
    from bills and successful payment records.

    This is the source of truth for:

        totalPurchases
        totalPaid
        pendingBalance
        paymentStatus
        lastPurchaseDate
    """

    customers_collection = get_customers_collection()
    bills_collection = get_bills_collection()
    payments_collection = get_payments_collection()

    customer = customers_collection.find_one({
        "id": customer_id
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail=f"Customer not found: {customer_id}"
        )

    # -----------------------------------------------------
    # 1. Calculate total purchases from bills
    # -----------------------------------------------------

    customer_bills = bills_collection.find({
        "customerId": customer_id
    })

    total_purchases = 0.0
    last_purchase_date = ""

    for bill in customer_bills:

        total_purchases += float(
            bill.get("totalAmount", 0) or 0
        )

        bill_date = str(
            bill.get("date", "") or ""
        )

        if bill_date > last_purchase_date:
            last_purchase_date = bill_date

    total_purchases = round(
        total_purchases,
        2
    )

    # -----------------------------------------------------
    # 2. Calculate total successful payments
    # -----------------------------------------------------

    successful_payments = payments_collection.find({
        "customerId": customer_id,
        "status": "Success"
    })

    total_paid = 0.0

    for payment in successful_payments:

        total_paid += float(
            payment.get("amount", 0) or 0
        )

    total_paid = round(
        total_paid,
        2
    )

    # -----------------------------------------------------
    # 3. Calculate pending balance
    # -----------------------------------------------------

    pending_balance = round(
        max(total_purchases - total_paid, 0),
        2
    )

    # -----------------------------------------------------
    # 4. Determine payment status
    # -----------------------------------------------------

    if total_purchases <= 0:
        payment_status = "UNPAID"

    elif pending_balance <= 0.01:
        payment_status = "PAID"

    elif total_paid > 0:
        payment_status = "PARTIAL"

    else:
        payment_status = "UNPAID"

    # -----------------------------------------------------
    # 5. Prepare update
    # -----------------------------------------------------

    update_data = {
        "totalPurchases": total_purchases,
        "totalPaid": total_paid,
        "pendingBalance": pending_balance,
        "paymentStatus": payment_status,
        "updatedAt": datetime.now(
            timezone.utc
        ).isoformat()
    }

    if last_purchase_date:
        update_data["lastPurchaseDate"] = (
            last_purchase_date
        )

    # -----------------------------------------------------
    # 6. Update customer
    # -----------------------------------------------------

    customers_collection.update_one(
        {
            "id": customer_id
        },
        {
            "$set": update_data
        }
    )

    # -----------------------------------------------------
    # 7. Return updated customer
    # -----------------------------------------------------

    updated_customer = customers_collection.find_one(
        {
            "id": customer_id
        },
        {
            "_id": 0
        }
    )

    return updated_customer


# =========================================================
# CREATE CUSTOMER
# =========================================================

@router.post("/", status_code=201)
async def create_customer(
    customer: CustomerModel
):
    collection = get_customers_collection()

    # Prevent duplicate customer IDs
    existing = collection.find_one({
        "id": customer.id
    })

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Customer with this ID already exists"
        )

    customer_data = customer.model_dump()

    now = datetime.now(
        timezone.utc
    ).isoformat()

    customer_data["createdAt"] = now
    customer_data["updatedAt"] = now

    # Explicitly initialize financial fields
    customer_data["totalPurchases"] = 0.0
    customer_data["totalPaid"] = 0.0
    customer_data["pendingBalance"] = 0.0
    customer_data["paymentStatus"] = "UNPAID"

    collection.insert_one(
        customer_data
    )

    customer_data.pop(
        "_id",
        None
    )

    return {
        "success": True,
        "message": "Customer created successfully",
        "customer": customer_data
    }


# =========================================================
# GET ALL CUSTOMERS
# =========================================================

@router.get("/")
async def get_customers():

    collection = get_customers_collection()

    customers = list(
        collection.find(
            {},
            {
                "_id": 0
            }
        ).sort(
            "name",
            1
        )
    )

    return {
        "success": True,
        "count": len(customers),
        "customers": customers
    }


# =========================================================
# GET SINGLE CUSTOMER
# =========================================================

@router.get("/{customer_id}")
async def get_customer(
    customer_id: str
):

    collection = get_customers_collection()

    customer = collection.find_one(
        {
            "id": customer_id
        },
        {
            "_id": 0
        }
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {
        "success": True,
        "customer": customer
    }


# =========================================================
# UPDATE CUSTOMER
# =========================================================

@router.put("/{customer_id}")
async def update_customer(
    customer_id: str,
    customer: CustomerModel
):

    collection = get_customers_collection()

    existing = collection.find_one({
        "id": customer_id
    })

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    customer_data = customer.model_dump()

    # Never allow changing the internal ID
    customer_data["id"] = customer_id

    # Preserve financial values from actual database data.
    # These values must not be manually overwritten by the
    # frontend.
    customer_data["totalPurchases"] = float(
        existing.get("totalPurchases", 0) or 0
    )

    customer_data["totalPaid"] = float(
        existing.get("totalPaid", 0) or 0
    )

    customer_data["pendingBalance"] = float(
        existing.get("pendingBalance", 0) or 0
    )

    customer_data["paymentStatus"] = existing.get(
        "paymentStatus",
        "UNPAID"
    )

    customer_data["updatedAt"] = (
        datetime.now(
            timezone.utc
        ).isoformat()
    )

    collection.update_one(
        {
            "id": customer_id
        },
        {
            "$set": customer_data
        }
    )

    # Recalculate financial data from source records
    updated_customer = recalculate_customer_financials(
        customer_id
    )

    return {
        "success": True,
        "message": "Customer updated successfully",
        "customer": updated_customer
    }


# =========================================================
# DELETE CUSTOMER
# =========================================================

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str
):

    collection = get_customers_collection()

    # Make sure customer exists
    customer = collection.find_one({
        "id": customer_id
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    # -----------------------------------------------------
    # Prevent deleting customer with bills
    # -----------------------------------------------------

    bills_collection = get_bills_collection()

    bill_exists = bills_collection.find_one({
        "customerId": customer_id
    })

    if bill_exists:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete customer because "
                "associated bills exist"
            )
        )

    # -----------------------------------------------------
    # Prevent deleting customer with payments
    # -----------------------------------------------------

    payments_collection = get_payments_collection()

    payment_exists = payments_collection.find_one({
        "customerId": customer_id
    })

    if payment_exists:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete customer because "
                "associated payments exist"
            )
        )

    # -----------------------------------------------------
    # Delete
    # -----------------------------------------------------

    result = collection.delete_one({
        "id": customer_id
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {
        "success": True,
        "message": "Customer deleted successfully"
    }

# =========================================================
# SYNC ALL CUSTOMER FINANCIALS
# =========================================================

@router.post("/sync-financials")
async def sync_all_customer_financials():

    collection = get_customers_collection()

    customers = list(
        collection.find(
            {},
            {"_id": 0, "id": 1}
        )
    )

    updated = []

    for customer in customers:

        customer_id = customer.get("id")

        if not customer_id:
            continue

        try:
            synced_customer = (
                recalculate_customer_financials(
                    customer_id
                )
            )

            updated.append(
                synced_customer
            )

        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Failed to synchronize customer "
                    f"{customer_id}: {error}"
                )
            )

    return {
        "success": True,
        "message": "All customer financials synchronized",
        "count": len(updated),
        "customers": updated
    }