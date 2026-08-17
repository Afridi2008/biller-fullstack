from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..database import db_manager
from ..models import PaymentRecordModel
from .customers import recalculate_customer_financials


router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"]
)


# =========================================================
# COLLECTION HELPERS
# =========================================================

def get_payments_collection():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB database is currently unavailable"
        )

    return db_manager.db["payments"]


def get_bills_collection():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB database is currently unavailable"
        )

    return db_manager.db["bills"]


# =========================================================
# BILL PAYMENT STATE
# =========================================================

def recalculate_bill_payment_state(invoice_id: str):
    """
    Recalculate bill payment information directly from
    successful payment records.
    """

    bills_collection = get_bills_collection()
    payments_collection = get_payments_collection()

    bill = bills_collection.find_one({
        "id": invoice_id
    })

    if not bill:
        raise HTTPException(
            status_code=404,
            detail=f"Bill not found for invoiceId: {invoice_id}"
        )

    total_amount = round(
        float(
            bill.get("totalAmount", 0) or 0
        ),
        2
    )

    payment_records = payments_collection.find({
        "invoiceId": invoice_id,
        "status": "Success"
    })

    total_paid = 0.0

    for record in payment_records:
        total_paid += float(
            record.get("amount", 0) or 0
        )

    total_paid = round(
        total_paid,
        2
    )

    balance_due = round(
        max(
            total_amount - total_paid,
            0
        ),
        2
    )

    if balance_due <= 0.01:
        balance_due = 0.0
        status = "PAID"

    elif total_paid > 0:
        status = "PARTIAL"

    else:
        status = "UNPAID"

    bills_collection.update_one(
        {
            "id": invoice_id
        },
        {
            "$set": {
                "advancePaid": total_paid,
                "balanceDue": balance_due,
                "status": status,
                "updatedAt": datetime.now(
                    timezone.utc
                ).isoformat()
            }
        }
    )

    updated_bill = bills_collection.find_one(
        {
            "id": invoice_id
        },
        {
            "_id": 0
        }
    )

    return updated_bill


# =========================================================
# CREATE PAYMENT
# =========================================================

@router.post("/", status_code=201)
async def create_payment(
    payment: PaymentRecordModel
):

    payments_collection = get_payments_collection()

    # -----------------------------------------------------
    # 1. Prevent duplicate payment ID
    # -----------------------------------------------------

    existing = payments_collection.find_one({
        "id": payment.id
    })

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Payment with this ID already exists"
        )

    # -----------------------------------------------------
    # 2. Validate bill
    # -----------------------------------------------------

    bills_collection = get_bills_collection()

    bill = bills_collection.find_one({
        "id": payment.invoiceId
    })

    if not bill:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Bill not found for invoiceId: "
                f"{payment.invoiceId}"
            )
        )

    # -----------------------------------------------------
    # 3. Validate amount
    # -----------------------------------------------------

    payment_amount = round(
        float(payment.amount),
        2
    )

    if payment_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Payment amount must be greater than zero"
        )

    # -----------------------------------------------------
    # 4. Calculate existing successful payments
    # -----------------------------------------------------

    total_amount = round(
        float(
            bill.get("totalAmount", 0) or 0
        ),
        2
    )

    existing_paid = 0.0

    existing_payments = payments_collection.find({
        "invoiceId": payment.invoiceId,
        "status": "Success"
    })

    for record in existing_payments:
        existing_paid += float(
            record.get("amount", 0) or 0
        )

    existing_paid = round(
        existing_paid,
        2
    )

    current_balance = round(
        max(
            total_amount - existing_paid,
            0
        ),
        2
    )

    # -----------------------------------------------------
    # 5. Prevent overpayment
    # -----------------------------------------------------

    if payment.status == "Success":

        if payment_amount > current_balance + 0.01:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Payment amount ₹{payment_amount:.2f} "
                    f"exceeds remaining balance "
                    f"₹{current_balance:.2f}"
                )
            )

    # -----------------------------------------------------
    # 6. Prepare document
    # -----------------------------------------------------

    payment_data = payment.model_dump()

    payment_data["amount"] = payment_amount

    if not payment_data.get("timestamp"):

        payment_data["timestamp"] = int(
            datetime.now(
                timezone.utc
            ).timestamp()
        )

    # -----------------------------------------------------
    # 7. Insert payment
    # -----------------------------------------------------

    try:

        payments_collection.insert_one(
            payment_data
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to create payment: {error}"
        )

    # -----------------------------------------------------
    # 8. Recalculate bill
    # -----------------------------------------------------

    try:

        updated_bill = recalculate_bill_payment_state(
            payment.invoiceId
        )

    except HTTPException:

        try:
            payments_collection.delete_one({
                "id": payment.id
            })
        except Exception:
            pass

        raise

    except Exception as error:

        try:
            payments_collection.delete_one({
                "id": payment.id
            })
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update bill after payment: "
                f"{error}"
            )
        )

    # -----------------------------------------------------
    # 9. Recalculate customer
    # -----------------------------------------------------

    try:

        updated_customer = (
            recalculate_customer_financials(
                payment.customerId
            )
        )

    except Exception as error:

        # Payment and bill are valid at this point.
        # Do not delete the payment merely because the
        # customer aggregate failed.

        raise HTTPException(
            status_code=500,
            detail=(
                "Payment created but customer financial "
                f"data could not be synchronized: {error}"
            )
        )

    # -----------------------------------------------------
    # 10. Return
    # -----------------------------------------------------

    payment_data.pop(
        "_id",
        None
    )

    return {
        "success": True,
        "message": "Payment created successfully",
        "payment": payment_data,
        "bill": updated_bill,
        "customer": updated_customer
    }


# =========================================================
# GET ALL PAYMENTS
# =========================================================

@router.get("/")
async def get_payments():

    collection = get_payments_collection()

    payments = list(
        collection.find(
            {},
            {
                "_id": 0
            }
        ).sort([
            ("date", -1),
            ("time", -1)
        ])
    )

    return {
        "success": True,
        "count": len(payments),
        "payments": payments
    }


# =========================================================
# GET SINGLE PAYMENT
# =========================================================

@router.get("/{payment_id}")
async def get_payment(
    payment_id: str
):

    collection = get_payments_collection()

    payment = collection.find_one(
        {
            "id": payment_id
        },
        {
            "_id": 0
        }
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return {
        "success": True,
        "payment": payment
    }


# =========================================================
# UPDATE PAYMENT
# =========================================================

@router.put("/{payment_id}")
async def update_payment(
    payment_id: str,
    payment: PaymentRecordModel
):

    collection = get_payments_collection()

    existing = collection.find_one({
        "id": payment_id
    })

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    old_invoice_id = existing.get(
        "invoiceId"
    )

    old_customer_id = existing.get(
        "customerId"
    )

    new_invoice_id = payment.invoiceId
    new_customer_id = payment.customerId

    # -----------------------------------------------------
    # Validate amount
    # -----------------------------------------------------

    payment_amount = round(
        float(payment.amount),
        2
    )

    if payment_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Payment amount must be greater than zero"
        )

    # -----------------------------------------------------
    # Validate new bill
    # -----------------------------------------------------

    bills_collection = get_bills_collection()

    new_bill = bills_collection.find_one({
        "id": new_invoice_id
    })

    if not new_bill:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Bill not found for invoiceId: "
                f"{new_invoice_id}"
            )
        )

    # -----------------------------------------------------
    # Calculate available balance
    # -----------------------------------------------------

    other_paid = 0.0

    other_payments = collection.find({
        "invoiceId": new_invoice_id,
        "status": "Success",
        "id": {
            "$ne": payment_id
        }
    })

    for record in other_payments:
        other_paid += float(
            record.get("amount", 0) or 0
        )

    other_paid = round(
        other_paid,
        2
    )

    total_amount = round(
        float(
            new_bill.get("totalAmount", 0) or 0
        ),
        2
    )

    available_balance = round(
        max(
            total_amount - other_paid,
            0
        ),
        2
    )

    if payment.status == "Success":

        if payment_amount > available_balance + 0.01:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Payment amount ₹{payment_amount:.2f} "
                    f"exceeds available balance "
                    f"₹{available_balance:.2f}"
                )
            )

    # -----------------------------------------------------
    # Prepare updated payment
    # -----------------------------------------------------

    payment_data = payment.model_dump()

    payment_data["id"] = payment_id
    payment_data["amount"] = payment_amount

    if not payment_data.get("timestamp"):

        payment_data["timestamp"] = existing.get(
            "timestamp",
            int(
                datetime.now(
                    timezone.utc
                ).timestamp()
            )
        )

    # -----------------------------------------------------
    # Update payment
    # -----------------------------------------------------

    collection.update_one(
        {
            "id": payment_id
        },
        {
            "$set": payment_data
        }
    )

    # -----------------------------------------------------
    # Recalculate old bill
    # -----------------------------------------------------

    if old_invoice_id != new_invoice_id:

        recalculate_bill_payment_state(
            old_invoice_id
        )

    # -----------------------------------------------------
    # Recalculate new bill
    # -----------------------------------------------------

    updated_bill = recalculate_bill_payment_state(
        new_invoice_id
    )

    # -----------------------------------------------------
    # Recalculate old customer
    # -----------------------------------------------------

    if (
        old_customer_id
        and old_customer_id != new_customer_id
    ):

        recalculate_customer_financials(
            old_customer_id
        )

    # -----------------------------------------------------
    # Recalculate new customer
    # -----------------------------------------------------

    updated_customer = (
        recalculate_customer_financials(
            new_customer_id
        )
    )

    # -----------------------------------------------------
    # Get updated payment
    # -----------------------------------------------------

    updated_payment = collection.find_one(
        {
            "id": payment_id
        },
        {
            "_id": 0
        }
    )

    return {
        "success": True,
        "message": "Payment updated successfully",
        "payment": updated_payment,
        "bill": updated_bill,
        "customer": updated_customer
    }


# =========================================================
# DELETE PAYMENT
# =========================================================

@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str
):

    payments_collection = get_payments_collection()

    # -----------------------------------------------------
    # 1. Find payment
    # -----------------------------------------------------

    payment = payments_collection.find_one({
        "id": payment_id
    })

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    invoice_id = payment.get(
        "invoiceId"
    )

    customer_id = payment.get(
        "customerId"
    )

    if not invoice_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment does not contain a valid invoiceId"
            )
        )

    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment does not contain a valid customerId"
            )
        )

    # -----------------------------------------------------
    # 2. Make sure bill exists
    # -----------------------------------------------------

    bills_collection = get_bills_collection()

    bill = bills_collection.find_one({
        "id": invoice_id
    })

    if not bill:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Bill not found for invoiceId: "
                f"{invoice_id}"
            )
        )

    # -----------------------------------------------------
    # 3. Delete payment
    # -----------------------------------------------------

    delete_result = payments_collection.delete_one({
        "id": payment_id
    })

    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Payment could not be deleted"
        )

    # -----------------------------------------------------
    # 4. Recalculate bill
    # -----------------------------------------------------

    try:

        updated_bill = (
            recalculate_bill_payment_state(
                invoice_id
            )
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Payment deleted but bill could not be "
                f"recalculated: {error}"
            )
        )

    # -----------------------------------------------------
    # 5. Recalculate customer
    # -----------------------------------------------------

    try:

        updated_customer = (
            recalculate_customer_financials(
                customer_id
            )
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Payment deleted but customer financial "
                f"data could not be synchronized: {error}"
            )
        )

    # -----------------------------------------------------
    # 6. Return
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Payment deleted successfully",
        "deletedPaymentId": payment_id,
        "bill": updated_bill,
        "customer": updated_customer
    }