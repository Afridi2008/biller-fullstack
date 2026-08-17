"""
Pydantic and standard Data Models for BILLER - Flex Print Management
Supports validation for Bills, Products, Customers, Payments, and Settings.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SizeVariantModel(BaseModel):
    id: str
    name: str
    costRate: float
    sellingRate: float

class ProductModel(BaseModel):
    id: str
    name: str
    subtitle: Optional[str] = ""
    type: str  # 'area', 'qty', 'fixed', 'custom'
    costRate: Optional[float] = 0.0
    sellingRate: Optional[float] = 0.0
    unitLabel: Optional[str] = "Sq.Ft"
    status: str = "active"  # 'active', 'inactive'
    variants: Optional[List[SizeVariantModel]] = []

class BillItemModel(BaseModel):
    id: str
    productId: str
    productName: str
    productType: str
    width: Optional[float] = 0.0
    height: Optional[float] = 0.0
    sqft: Optional[float] = 0.0
    quantity: int = 1
    selectedVariantName: Optional[str] = ""
    rate: float
    costRate: Optional[float] = 0.0
    finishingOptions: Optional[List[str]] = []
    finishingCost: Optional[float] = 0.0
    amount: float

class BillModel(BaseModel):
    id: str
    invoiceNumber: str
    customerId: str
    customerName: str
    customerPhone: str
    customerCompany: Optional[str] = ""
    customerGstin: Optional[str] = ""
    date: str
    dueDate: Optional[str] = ""
    items: List[BillItemModel]
    itemsSummary: str
    subTotal: float
    discountPercent: float = 0.0
    discountAmount: float = 0.0
    taxableAmount: float
    cgstPercent: float = 0.0
    cgstAmount: float = 0.0
    sgstPercent: float = 0.0
    sgstAmount: float = 0.0
    totalAmount: float
    advancePaid: float = 0.0
    balanceDue: float
    paymentMethod: str = "UPI"
    paymentRef: Optional[str] = ""
    status: str  # 'PAID', 'PARTIAL', 'UNPAID'
    notes: Optional[str] = ""
    createdAt: Optional[str] = ""

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

class PaymentRecordModel(BaseModel):
    id: str
    date: str
    time: str
    invoiceId: str
    invoiceNumber: str
    customerId: str
    customerName: str
    customerType: Optional[str] = "Retail"
    method: str  # 'UPI', 'Cash', 'Card', 'Bank Tx'
    amount: float
    collectedBy: str
    refTxnId: Optional[str] = ""
    status: str = "Success"
    timestamp: Optional[int] = None

class ShopSettingsModel(BaseModel):
    shopName: str = "BILLER PRINT HUB"
    tagline: str = "Flex Banners, Vinyl & Large Format Printing"
    address: str = "Plot 42, Industrial Area Phase II"
    city: str = "Mumbai"
    state: str = "Maharashtra"
    pincode: str = "400072"
    phone: str = "+91 98200 12345"
    email: str = "orders@billerflex.com"
    gstin: str = "27AAACB2233D1Z4"
    currency: str = "₹"
    defaultCgstPercent: float = 9.0
    defaultSgstPercent: float = 9.0
    terms: List[str] = [
        "1. Goods once printed & delivered cannot be taken back or refunded.",
        "2. 50% advance required for all custom large format print jobs.",
        "3. Any design discrepancies must be reported within 24 hours of delivery.",
        "4. Subject to local jurisdiction."
    ]
