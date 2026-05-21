from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.cart import CartItem
from app.models.catalog import Product
from app.models.user import User
from app.schemas.cart import CartItemRead, CartItemUpsert

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=list[CartItemRead])
def get_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id)
        .order_by(CartItem.updated_at.desc())
        .all()
    )


@router.put("/items/{product_id}", response_model=CartItemRead)
def upsert_item(
    product_id: str,
    body: CartItemUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if body.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only {product.stock} unit(s) of {product.name} available",
        )

    item = db.get(CartItem, (user.id, product_id))
    if item:
        item.quantity = body.quantity
    else:
        item = CartItem(user_id=user.id, product_id=product_id, quantity=body.quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(
    product_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = db.get(CartItem, (user.id, product_id))
    if item:
        db.delete(item)
        db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
