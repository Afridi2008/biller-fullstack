from typing import List
from pydantic import BaseModel, Field


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
    terms: List[str] = Field(
        default_factory=lambda: [
            "1. Goods once printed & delivered cannot be taken back or refunded.",
            "2. 50% advance required for all custom large format print jobs.",
            "3. Any design discrepancies must be reported within 24 hours of delivery.",
            "4. Subject to local jurisdiction.",
        ]
    )