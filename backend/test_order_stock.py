"""Self-check for checkout against per-option stock — the guard that stops a
sold-out flavour from being ordered. Runs the real create_order against SQLite.
Run with: .venv/bin/python test_order_stock.py
"""

from decimal import Decimal
from types import SimpleNamespace

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api import orders as api
from app.core.database import Base
from app.models import order  # noqa: F401 — User.orders needs Order mapped before configure
from app.models.catalog import Category, Product, ProductStatus
from app.schemas.order import OrderCreate, OrderItemCreate

# The rate limiter needs a real ASGI request; it isn't what we're testing.
create_order = getattr(api.create_order, "__wrapped__", api.create_order)
REQUEST = SimpleNamespace(headers={}, client=SimpleNamespace(host="127.0.0.1"))


def variants(strawberry_stock, coffee_stock=5, size_stock=None):
    return [
        {"name": "Size", "options": [{"label": "1kg", "price": "1800", "stock": size_stock}]},
        {
            "name": "Flavor",
            "options": [
                {"label": "Strawberry", "price": None, "stock": strawberry_stock},
                {"label": "Coffee", "price": None, "stock": coffee_stock},
            ],
        },
    ]


def fresh_db(product_stock=50, groups=None) -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = Session(engine)
    db.add(Category(id="c1", name="Protein", slug="protein"))
    db.add(
        Product(
            id="p1",
            sku="WHEY-1",
            name="Whey",
            slug="whey",
            description="…",
            price=Decimal("1000"),
            stock=product_stock,
            status=ProductStatus.published,
            category_id="c1",
            variants=groups,
        )
    )
    db.commit()
    return db


def buy(db, variant, quantity=1):
    return create_order(
        REQUEST,
        OrderCreate(
            customer_name="Krisnomoy",
            phone="01934753058",
            address="Mirpara, Rampura road",
            payment_method="cod",
            items=[OrderItemCreate(product_id="p1", quantity=quantity, variant=variant)],
        ),
        db,
        None,
    )


def status_of(fn, *args) -> int:
    """Call `fn` expecting it to reject, and return the HTTP status it raised."""
    try:
        fn(*args)
    except HTTPException as exc:
        return exc.status_code
    raise AssertionError("expected an HTTPException")


def stock_of(db, label) -> int | None:
    groups = db.get(Product, "p1").variants
    option = next(o for g in groups for o in g["options"] if o["label"] == label)
    return option["stock"]


def test_a_sold_out_option_cannot_be_ordered():
    db = fresh_db(product_stock=50, groups=variants(strawberry_stock=0))
    # The product itself has 50 units — only the flavour is out.
    assert status_of(buy, db, "1kg / Strawberry") == 409
    assert buy(db, "1kg / Coffee").total == Decimal("1800")


def test_ordering_draws_the_option_down_not_the_product():
    db = fresh_db(product_stock=50, groups=variants(strawberry_stock=4))
    buy(db, "1kg / Strawberry", quantity=3)
    assert stock_of(db, "Strawberry") == 1
    assert stock_of(db, "Coffee") == 5  # its sibling is untouched
    assert db.get(Product, "p1").stock == 50  # the product pool is not the pool in use


def test_the_last_units_sell_and_then_stop():
    db = fresh_db(groups=variants(strawberry_stock=2))
    buy(db, "1kg / Strawberry", quantity=2)
    assert stock_of(db, "Strawberry") == 0
    assert status_of(buy, db, "1kg / Strawberry") == 409


def test_one_order_cannot_outrun_stock_by_splitting_into_lines():
    # Two lines of the same choice must be summed before the check, or 2+2 slips
    # past a pool of 3 as "two orders of 2".
    db = fresh_db(groups=variants(strawberry_stock=3))
    payload = OrderCreate(
        customer_name="Krisnomoy",
        phone="01934753058",
        address="Mirpara, Rampura road",
        payment_method="cod",
        items=[
            OrderItemCreate(product_id="p1", quantity=2, variant="1kg / Strawberry"),
            OrderItemCreate(product_id="p1", quantity=2, variant="1kg / Strawberry"),
        ],
    )
    assert status_of(create_order, REQUEST, payload, db, None) == 409
    assert stock_of(db, "Strawberry") == 3  # rolled back, nothing consumed


def test_siblings_share_a_scarce_size():
    # Size 1kg has 3 units total; the two flavours draw on it together.
    db = fresh_db(groups=variants(strawberry_stock=9, coffee_stock=9, size_stock=3))
    buy(db, "1kg / Strawberry", quantity=2)
    assert stock_of(db, "1kg") == 1
    assert status_of(buy, db, "1kg / Coffee", 2) == 409
    buy(db, "1kg / Coffee", 1)
    assert stock_of(db, "1kg") == 0


def test_products_without_option_stock_still_use_the_product_pool():
    db = fresh_db(product_stock=4, groups=variants(strawberry_stock=None, coffee_stock=None))
    buy(db, "1kg / Strawberry", quantity=3)
    assert db.get(Product, "p1").stock == 1
    assert status_of(buy, db, "1kg / Coffee", 2) == 409


def test_a_plain_product_is_unaffected():
    db = fresh_db(product_stock=2, groups=None)
    buy(db, None, quantity=2)
    assert db.get(Product, "p1").stock == 0
    assert status_of(buy, db, None) == 409


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all per-option stock checks passed")
