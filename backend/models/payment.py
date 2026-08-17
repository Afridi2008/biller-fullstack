from typing import Optional
from pydantic import BaseModel


class PaymentRecordModel(BaseModel):
    id: str
    date: str
    time: str
    invoiceId: str
    invoiceNumber: str
    customerId: str
    customerName: str
    customerType: Optional[str] = "Retail"
    method: str
    amount: float
    collectedBy: str
    refTxnId: Optional[str] = ""
    status: str = "Success"
    timestamp: Optional[int] = None