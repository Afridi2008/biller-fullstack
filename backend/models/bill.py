from typing import List, Optional

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    AliasChoices,
    field_validator,
    model_validator,
)


class BillItemModel(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        populate_by_name=True,
    )

    id: str
    productId: Optional[str] = ""

    productName: str

    # Accept both `productType` and legacy frontend `type`
    productType: Optional[str] = Field(
        default="standard",
        validation_alias=AliasChoices("productType", "type"),
    )

    width: Optional[float] = 0.0
    height: Optional[float] = 0.0
    sqft: Optional[float] = 0.0

    quantity: float = 1.0
    selectedVariantName: Optional[str] = ""

    rate: float
    costRate: Optional[float] = 0.0

    finishingOptions: List[str] = Field(
        default_factory=list
    )

    finishingCost: Optional[float] = 0.0

    # Legacy/frontend field
    finishing: Optional[str] = ""

    amount: float

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value):
        if value <= 0:
            raise ValueError(
                "Item quantity must be greater than 0"
            )
        return value

    @field_validator("rate")
    @classmethod
    def validate_rate(cls, value):
        if value < 0:
            raise ValueError(
                "Item rate cannot be negative"
            )
        return value

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value):
        if value < 0:
            raise ValueError(
                "Item amount cannot be negative"
            )
        return value

    @model_validator(mode="after")
    def validate_item(self):

        product_type = (self.productType or "").strip().lower()

        if not self.productName.strip():
            raise ValueError(
                "Product name is required"
            )

        if product_type == "area":

            if self.width is None or self.width <= 0:
                raise ValueError(
                    f"Valid width is required for area product: "
                    f"{self.productName}"
                )

            if self.height is None or self.height <= 0:
                raise ValueError(
                    f"Valid height is required for area product: "
                    f"{self.productName}"
                )

            calculated_sqft = self.width * self.height

            if self.sqft is None or self.sqft <= 0:
                raise ValueError(
                    f"Valid sqft is required for area product: "
                    f"{self.productName}"
                )

            if abs(self.sqft - calculated_sqft) > 0.01:
                raise ValueError(
                    f"Invalid sqft for {self.productName}. "
                    f"Expected approximately {calculated_sqft}"
                )

        return self


class BillModel(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        populate_by_name=True,
    )

    id: str

    invoiceNumber: str

    customerId: str
    customerName: str
    customerPhone: str = ""

    customerAddress: Optional[str] = ""
    customerCompany: Optional[str] = ""
    customerGstin: Optional[str] = ""

    date: str
    dueDate: Optional[str] = ""

    items: List[BillItemModel]

    itemsSummary: str = ""

    # Accept both `subtotal` and legacy `subTotal`
    subtotal: float = Field(
        validation_alias=AliasChoices(
            "subtotal",
            "subTotal"
        )
    )

    discountPercent: float = 0.0
    discountAmount: float = 0.0

    taxableAmount: float = 0.0

    cgstPercent: float = 0.0
    cgstAmount: float = 0.0

    sgstPercent: float = 0.0
    sgstAmount: float = 0.0

    taxAmount: float = 0.0

    totalAmount: float

    advancePaid: float = 0.0

    balanceDue: float

    paymentMethod: str = "UPI"

    paymentRef: Optional[str] = ""

    status: str

    notes: Optional[str] = ""

    createdAt: Optional[str] = ""

    @field_validator("invoiceNumber")
    @classmethod
    def validate_invoice_number(cls, value):
        value = value.strip()

        if not value:
            raise ValueError(
                "Invoice number is required"
            )

        return value

    @field_validator(
        "subtotal",
        "discountPercent",
        "discountAmount",
        "taxableAmount",
        "cgstPercent",
        "cgstAmount",
        "sgstPercent",
        "sgstAmount",
        "taxAmount",
    )
    @classmethod
    def validate_non_negative_financial_values(cls, value):
        if value < 0:
            raise ValueError(
                "Financial values cannot be negative"
            )

        return value

    @field_validator("totalAmount")
    @classmethod
    def validate_total_amount(cls, value):
        if value <= 0:
            raise ValueError(
                "Bill total must be greater than 0"
            )

        return value

    @field_validator("advancePaid")
    @classmethod
    def validate_advance_paid(cls, value):
        if value < 0:
            raise ValueError(
                "Advance payment cannot be negative"
            )

        return value

    @field_validator("balanceDue")
    @classmethod
    def validate_balance_due(cls, value):
        if value < 0:
            raise ValueError(
                "Balance due cannot be negative"
            )

        return value

    @model_validator(mode="after")
    def validate_bill(self):

        # -----------------------------------------
        # 1. At least one item
        # -----------------------------------------

        if not self.items:
            raise ValueError(
                "Bill must contain at least one item"
            )

        # -----------------------------------------
        # 2. Calculate subtotal from items
        # -----------------------------------------

        calculated_subtotal = sum(
            item.amount for item in self.items
        )

        if abs(
            self.subtotal - calculated_subtotal
        ) > 0.01:

            raise ValueError(
                "Subtotal does not match the sum of item amounts"
            )

        # -----------------------------------------
        # 3. Validate discount
        # -----------------------------------------

        if self.discountPercent > 100:
            raise ValueError(
                "Discount percentage cannot exceed 100"
            )

        calculated_discount = (
            self.subtotal
            * self.discountPercent
            / 100
        )

        if abs(
            self.discountAmount - calculated_discount
        ) > 0.01:

            raise ValueError(
                "Discount amount does not match discount percentage"
            )

        # -----------------------------------------
        # 4. Calculate taxable amount
        # -----------------------------------------

        calculated_taxable = (
            self.subtotal
            - self.discountAmount
        )

        if calculated_taxable < 0:
            calculated_taxable = 0

        if abs(
            self.taxableAmount - calculated_taxable
        ) > 0.01:

            raise ValueError(
                "Taxable amount does not match subtotal minus discount"
            )

        # -----------------------------------------
        # 5. Validate GST percentages
        # -----------------------------------------

        if self.cgstPercent > 100:
            raise ValueError(
                "CGST percentage cannot exceed 100"
            )

        if self.sgstPercent > 100:
            raise ValueError(
                "SGST percentage cannot exceed 100"
            )

        # -----------------------------------------
        # 6. Calculate CGST / SGST
        # -----------------------------------------

        calculated_cgst = (
            self.taxableAmount
            * self.cgstPercent
            / 100
        )

        calculated_sgst = (
            self.taxableAmount
            * self.sgstPercent
            / 100
        )

        if abs(
            self.cgstAmount - calculated_cgst
        ) > 0.01:

            raise ValueError(
                "CGST amount does not match CGST percentage"
            )

        if abs(
            self.sgstAmount - calculated_sgst
        ) > 0.01:

            raise ValueError(
                "SGST amount does not match SGST percentage"
            )

        # -----------------------------------------
        # 7. Calculate total tax
        # -----------------------------------------

        calculated_tax = (
            self.cgstAmount
            + self.sgstAmount
        )

        if abs(
            self.taxAmount - calculated_tax
        ) > 0.01:

            raise ValueError(
                "Tax amount does not match CGST plus SGST"
            )

        # -----------------------------------------
        # 8. Calculate final bill total
        # -----------------------------------------

        calculated_total = (
            self.taxableAmount
            + self.taxAmount
        )

        if abs(
            self.totalAmount - calculated_total
        ) > 0.01:

            raise ValueError(
                "Total amount does not match taxable amount plus tax"
            )

        # -----------------------------------------
        # 9. Advance cannot exceed total
        # -----------------------------------------

        if self.advancePaid > self.totalAmount + 0.01:
            raise ValueError(
                "Advance payment cannot exceed bill total"
            )

        # -----------------------------------------
        # 10. Calculate balance
        # -----------------------------------------

        expected_balance = max(
            0,
            self.totalAmount - self.advancePaid
        )

        if abs(
            self.balanceDue - expected_balance
        ) > 0.01:

            raise ValueError(
                "Balance due does not match total amount minus advance payment"
            )

        # -----------------------------------------
        # 11. Validate status
        # -----------------------------------------

        expected_status = (
            "PAID"
            if expected_balance <= 0.01
            else "PARTIAL"
            if self.advancePaid > 0
            else "UNPAID"
        )

        if self.status.upper() != expected_status:
            raise ValueError(
                f"Invalid bill status. Expected {expected_status}"
            )

        return self