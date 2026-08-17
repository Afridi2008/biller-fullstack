from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..database import db_manager
from ..models import ProductModel


router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


def get_products_collection():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB database is currently unavailable"
        )

    return db_manager.db["products"]


@router.post("/", status_code=201)
async def create_product(product: ProductModel):
    collection = get_products_collection()

    existing = collection.find_one({"id": product.id})

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Product with this ID already exists"
        )

    product_data = product.model_dump()

    now = datetime.now(timezone.utc).isoformat()

    product_data["createdAt"] = now
    product_data["updatedAt"] = now

    collection.insert_one(product_data)

    return {
        "success": True,
        "message": "Product created successfully",
        "product": product_data
    }


@router.get("/")
async def get_products():
    collection = get_products_collection()

    products = list(
        collection.find(
            {},
            {"_id": 0}
        ).sort("name", 1)
    )

    return {
        "success": True,
        "count": len(products),
        "products": products
    }


@router.get("/{product_id}")
async def get_product(product_id: str):
    collection = get_products_collection()

    product = collection.find_one(
        {"id": product_id},
        {"_id": 0}
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "success": True,
        "product": product
    }


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    product: ProductModel
):
    collection = get_products_collection()

    existing = collection.find_one({
        "id": product_id
    })

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product_data = product.model_dump()

    product_data["id"] = product_id
    product_data["updatedAt"] = (
        datetime.now(timezone.utc).isoformat()
    )

    collection.update_one(
        {"id": product_id},
        {"$set": product_data}
    )

    updated_product = collection.find_one(
        {"id": product_id},
        {"_id": 0}
    )

    return {
        "success": True,
        "message": "Product updated successfully",
        "product": updated_product
    }


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    collection = get_products_collection()

    result = collection.delete_one({
        "id": product_id
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "success": True,
        "message": "Product deleted successfully"
    }