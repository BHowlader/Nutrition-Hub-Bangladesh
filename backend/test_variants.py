"""Self-check for variant pricing — the one place a client could otherwise dictate
what it pays. Run with: .venv/bin/python test_variants.py
"""

from decimal import Decimal
from types import SimpleNamespace

from fastapi import HTTPException

from app.core.variants import resolve_variant, variants_to_json


def product(price="1000", variants=None):
    return SimpleNamespace(name="Whey", price=Decimal(price), variants=variants)


GROUPS = [
    {"name": "Size", "options": [{"label": "500g", "price_delta": "0"}, {"label": "1kg", "price_delta": "450"}]},
    {"name": "Flavor", "options": [{"label": "Strawberry", "price_delta": "0"}, {"label": "Coffee", "price_delta": "50"}]},
]


def test_plain_product_ignores_variant():
    assert resolve_variant(product(), None) == (None, Decimal("1000"))
    assert resolve_variant(product(), "anything") == (None, Decimal("1000"))


def test_deltas_add_to_base_price():
    p = product(variants=GROUPS)
    assert resolve_variant(p, "500g / Strawberry") == ("500g / Strawberry", Decimal("1000"))
    assert resolve_variant(p, "1kg / Coffee") == ("1kg / Coffee", Decimal("1500"))


def test_whitespace_is_normalized():
    variant, price = resolve_variant(product(variants=GROUPS), " 1kg /  Strawberry ")
    assert variant == "1kg / Strawberry"
    assert price == Decimal("1450")


def test_unknown_or_missing_choices_are_rejected():
    p = product(variants=GROUPS)
    for bad in [None, "", "1kg", "1kg / Mango", "1kg / Coffee / Extra"]:
        try:
            resolve_variant(p, bad)
        except HTTPException as exc:
            assert exc.status_code == 400
        else:
            raise AssertionError(f"expected rejection for {bad!r}")


def test_serializer_keeps_money_as_strings():
    groups = [
        SimpleNamespace(
            name="Size",
            options=[SimpleNamespace(label="1kg", price_delta=Decimal("450.00"))],
        )
    ]
    assert variants_to_json(groups) == [
        {"name": "Size", "options": [{"label": "1kg", "price_delta": "450.00"}]}
    ]
    assert variants_to_json(None) is None
    assert variants_to_json([]) is None


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all variant pricing checks passed")
