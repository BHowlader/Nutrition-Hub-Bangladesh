"""Self-check for Pathao delivery charges on checkout — the money path that
prices shipping from the delivery address. Runs the real create_order against
SQLite. Run with: .venv/bin/python test_delivery.py
"""

from decimal import Decimal

from fastapi import HTTPException
from pydantic import ValidationError

from test_order_stock import REQUEST, create_order, fresh_db
from app.api.orders import delivery_areas
from app.core.delivery import AREA_ZONES, DELIVERY_CHARGES
from app.schemas.order import OrderCreate, OrderItemCreate


def order(db, division="Dhaka", area="Mirpur", quantity=1, address="Flat 3B, Road 7", **extra):
    return create_order(
        REQUEST,
        OrderCreate(
            customer_name="Krisnomoy",
            phone="01934753058",
            address=address,
            payment_method="cod",
            division=division,
            area=area,
            items=[OrderItemCreate(product_id="p1", quantity=quantity)],
            **extra,
        ),
        db,
        None,
    )


def status_of(fn, *args, **kwargs) -> int:
    try:
        fn(*args, **kwargs)
    except HTTPException as exc:
        return exc.status_code
    raise AssertionError("expected an HTTPException")


def test_the_address_picks_the_rate():
    # Product is priced 1000 in fresh_db().
    for division, area, charge in (
        ("Dhaka", "Mirpur", 90),          # Dhaka city
        ("Dhaka", "Savar", 130),          # the sub-urban ring
        ("Dhaka", "Tangail", 170),        # same division, still outside
        ("Sylhet", "Sylhet", 170),
    ):
        placed = order(fresh_db(), division, area)
        assert placed.delivery_charge == Decimal(charge), (area, placed.delivery_charge)
        assert placed.total == Decimal(1000 + charge), (area, placed.total)


def test_a_customer_cannot_send_a_cheaper_zone():
    # The old client-chosen field is gone; pydantic drops it and the address decides.
    placed = order(fresh_db(), "Rangpur", "Dinajpur", delivery_zone="inside_dhaka")
    assert placed.delivery_zone == "outside_dhaka"
    assert placed.total == Decimal("1170")


def test_an_address_we_do_not_serve_is_rejected():
    # Real area, wrong division — the pair has to exist, not just the name.
    assert status_of(order, fresh_db(), "Sylhet", "Mirpur") == 422
    assert status_of(order, fresh_db(), "Dhaka", "Atlantis") == 422


def test_a_missing_area_never_falls_back_to_the_cheap_rate():
    for missing in ({"division": ""}, {"area": ""}):
        try:
            order(fresh_db(), **{"division": "Dhaka", "area": "Mirpur", **missing})
        except (ValidationError, HTTPException):
            continue
        raise AssertionError(f"expected {missing} to be rejected")


def test_the_stored_address_is_courier_ready():
    placed = order(fresh_db(), "Chattogram", "Cox's Bazar", address="House 12, Kolatoli Road")
    assert placed.address == "House 12, Kolatoli Road, Cox's Bazar, Chattogram"


def test_the_charge_is_per_order_not_per_item():
    assert order(fresh_db(), "Khulna", "Jashore", quantity=3).total == Decimal("3170")


def test_every_listed_area_prices_itself():
    listed = {(d["name"], a["name"]): a for d in delivery_areas() for a in d["areas"]}
    assert listed.keys() == AREA_ZONES.keys()  # the form offers exactly what we price
    for (division, area), entry in listed.items():
        assert Decimal(entry["charge"]) == DELIVERY_CHARGES[AREA_ZONES[(division, area)]]
    assert listed[("Dhaka", "Gulshan")]["zone"] == "inside_dhaka"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all delivery charge checks passed")
