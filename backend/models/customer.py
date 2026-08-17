from typing import Optional
from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerModel(BaseModel):
    id: str
    name: str
    companyName: Optional[str] = ""
    contactPerson: Optional[str] = ""
    phone: str
    email: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    totalPurchases: float = 0.0
    totalPaid: float = 0.0
    pendingBalance: float = 0.0
    lastPurchaseDate: Optional[str] = ""