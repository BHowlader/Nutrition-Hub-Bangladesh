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
    {"name": "Flavor", "options": [{"label": "Strawberry", "price": None}, {"label": "Coffee", "price": None}]},
    {"name": "Size", "options": [{"label": "500g", "price": "1000"}, {"label": "1kg", "price": "1800"}]},
]


def test_plain_product_ignores_variant():
    assert resolve_variant(product(), None) == (None, Decimal("1000"))
    assert resolve_variant(product(), "anything") == (None, Decimal("1000"))


def test_option_price_is_absolute_not_a_delta():
    p = product(variants=GROUPS)
    assert resolve_variant(p, "Strawberry / 500g") == ("Strawberry / 500g", Decimal("1000"))
    assert resolve_variant(p, "Coffee / 1kg") == ("Coffee / 1kg", Decimal("1800"))


def test_priceless_options_fall_back_to_the_product_price():
    groups = [{"name": "Flavor", "options": [{"label": "Mango"}, {"label": "Coffee", "price": "1250"}]}]
    p = product(variants=groups)
    assert resolve_variant(p, "Mango")[1] == Decimal("1000")
    assert resolve_variant(p, "Coffee")[1] == Decimal("1250")


def test_whitespace_is_normalized():
    variant, price = resolve_variant(product(variants=GROUPS), " Strawberry /  1kg ")
    assert variant == "Strawberry / 1kg"
    assert price == Decimal("1800")


def test_unknown_or_missing_choices_are_rejected():
    p = product(variants=GROUPS)
    for bad in [None, "", "1kg", "Mango / 1kg", "Coffee / 1kg / Extra"]:
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
            options=[
                SimpleNamespace(
                    label="1kg", price=Decimal("1800.00"), description="Bulk tub", image_url="https://cdn/1kg.jpg"
                ),
                SimpleNamespace(label="500g", price=None, description=None, image_url=None),
            ],
        )
    ]
    assert variants_to_json(groups) == [
        {
            "name": "Size",
            "options": [
                {
                    "label": "1kg",
                    "price": "1800.00",
                    "description": "Bulk tub",
                    "image_url": "https://cdn/1kg.jpg",
                },
                {"label": "500g", "price": None, "description": None, "image_url": None},
            ],
        }
    ]
    assert variants_to_json(None) is None
    assert variants_to_json([]) is None


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all variant pricing checks passed")
