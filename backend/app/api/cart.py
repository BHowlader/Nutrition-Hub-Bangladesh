from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.variants import resolve_variant
from app.models.cart import CartItem
from app.models.catalog import Product
from app.models.user import User
from app.schemas.cart import CartItemRead, CartItemUpsert

router = APIRouter(prefix="/cart", tags=["cart"])


def _read(item: CartItem) -> CartItemRead:
    """Price every line server-side so variant surcharges can't be spoofed.

    Reading is forgiving: a line saved before the admin changed the product's
    variants shows the base price instead of 400-ing the customer's whole cart.
    Checkout stays strict — app/api/orders.py re-resolves and rejects it there.
    """
    try:
        _canonical, unit_price = resolve_variant(item.product, item.variant)
    except HTTPException:
        unit_price = item.product.price
    return CartItemRead(
        product_id=item.product_id,
        quantity=item.quantity,
        variant=item.variant or None,
        unit_price=unit_price,
        product=item.product,
    )


@router.get("", response_model=list[CartItemRead])
def get_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id)
        .order_by(CartItem.updated_at.desc())
        .all()
    )
    return [_read(item) for item in items]


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

    canonical, _price = resolve_variant(product, body.variant)
    key = canonical or ""

    item = db.get(CartItem, (user.id, product_id, key))
    if item:
        item.quantity = body.quantity
    else:
        item = CartItem(user_id=user.id, product_id=product_id, variant=key, quantity=body.quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return _read(item)


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(
    product_id: str,
    variant: str = Query(default="", max_length=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = db.get(CartItem, (user.id, product_id, variant))
    if item:
        db.delete(item)
        db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
