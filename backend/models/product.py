from typing import List, Optional
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
    type: str
    costRate: Optional[float] = 0.0
    sellingRate: Optional[float] = 0.0
    unitLabel: Optional[str] = "Sq.Ft"
    status: str = "active"
    variants: Optional[List[SizeVariantModel]] = Field(default_factory=list)