"""Self-check for Pathao delivery charges on checkout — the money path that
adds shipping to the order total. Runs the real create_order against SQLite.
Run with: .venv/bin/python test_delivery.py
"""

from decimal import Decimal

from test_order_stock import REQUEST, create_order, fresh_db
from app.schemas.order import OrderCreate, OrderItemCreate


def order(db, zone=None, quantity=1):
    kwargs = {"delivery_zone": zone} if zone else {}
    return create_order(
        REQUEST,
        OrderCreate(
            customer_name="Krisnomoy",
            phone="01934753058",
            address="Mirpara, Rampura road",
            payment_method="cod",
            items=[OrderItemCreate(product_id="p1", quantity=quantity)],
            **kwargs,
        ),
        db,
        None,
    )


def test_each_zone_bills_its_pathao_rate():
    for zone, charge in (("inside_dhaka", 90), ("sub_urban", 130), ("outside_dhaka", 170)):
        placed = order(fresh_db(), zone)
        assert placed.delivery_charge == Decimal(charge), (zone, placed.delivery_charge)
        # Product is priced 1000 in fresh_db().
        assert placed.total == Decimal(1000 + charge), (zone, placed.total)


def test_an_order_without_a_zone_falls_back_to_dhaka():
    placed = order(fresh_db())
    assert placed.delivery_zone == "inside_dhaka"
    assert placed.total == Decimal("1090")


def test_an_unknown_zone_is_rejected_before_it_reaches_the_rates():
    try:
        OrderCreate(
            customer_name="Krisnomoy",
            phone="01934753058",
            address="Mirpara, Rampura road",
            items=[OrderItemCreate(product_id="p1", quantity=1)],
            delivery_zone="free",
        )
    except Exception as exc:  # pydantic ValidationError
        assert "delivery_zone" in str(exc)
    else:
        raise AssertionError("expected a validation error")


def test_the_charge_is_not_multiplied_by_the_basket():
    # Delivery is per order, not per item.
    assert order(fresh_db(), "outside_dhaka", quantity=3).total == Decimal("3170")


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
