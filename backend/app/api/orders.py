from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.catalog import Product
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    order = Order(
        customer_name=payload.customer_name,
        phone=payload.phone,
        address=payload.address,
        payment_method=payload.payment_method,
    )

    total = Decimal("0")
    for item in payload.items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(status_code=409, detail=f"{product.name} does not have enough stock")

        product.stock -= item.quantity
        total += product.price * item.quantity
        order.items.append(OrderItem(product_id=product.id, quantity=item.quantity, unit_price=product.price))

    order.total = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
