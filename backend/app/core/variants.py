"""Product variants — option groups stored as JSON on the product row.

Shape (as persisted in `products.variants`):

    [{"name": "Size",   "options": [{"label": "500g", "price": "1000", "description": null},
                                    {"label": "1kg",  "price": "1800", "description": "Bulk tub"}]},
     {"name": "Flavor", "options": [{"label": "Strawberry", "price": null, "description": null}]}]

`price` is the option's OWN price, not an adjustment to the product price. A null
price means "use the product price". When more than one chosen option carries a
price, the last group wins — groups are read in order, so put the pricing axis
(usually Size) last if a product ever prices on two axes.

A customer's choice travels as ONE human-readable string built by joining the
chosen labels in group order: "1kg / Strawberry". That single string is the cart
line key, what the admin reads off the order, and what we re-price against.
Labels are rejected at write time if they contain "/", which keeps the split
unambiguous without needing a second identifier column.

ponytail: stock stays a single per-product pool rather than per-variant. Split it
only if the shop actually needs to sell out one flavour independently.
"""

from decimal import Decimal, InvalidOperation

from fastapi import HTTPException, status

VARIANT_SEPARATOR = " / "
MAX_VARIANT_LENGTH = 200


def variants_to_json(groups) -> list[dict] | None:
    """Serialize validated VariantGroup schemas for the JSON column.

    Decimals are stored as strings — JSON columns cannot hold Decimal, and floats
    are the wrong type for money.
    """
    if not groups:
        return None
    return [
        {
            "name": group.name,
            "options": [
                {
                    "label": option.label,
                    "price": None if option.price is None else str(option.price),
                    "description": option.description or None,
                }
                for option in group.options
            ],
        }
        for group in groups
    ]


def _groups(product) -> list[dict]:
    raw = getattr(product, "variants", None) or []
    return [g for g in raw if isinstance(g, dict)] if isinstance(raw, list) else []


def _money(raw, fallback: Decimal) -> Decimal:
    try:
        return Decimal(str(raw))
    except (InvalidOperation, ValueError, TypeError):
        return fallback


def resolve_variant(product, variant: str | None) -> tuple[str | None, Decimal]:
    """Validate a customer's variant choice and price it.

    Returns the canonical variant string (None when the product has no variants)
    and the authoritative unit price. The client never supplies a price.
    """
    groups = _groups(product)
    chosen = (variant or "").strip()

    if not groups:
        # Products without variants ignore whatever the client sent.
        return None, Decimal(product.price)

    parts = [part.strip() for part in chosen.split(VARIANT_SEPARATOR)] if chosen else []
    if len(parts) != len(groups):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Choose an option for every {product.name} variant",
        )

    price = Decimal(product.price)
    for group, label in zip(groups, parts):
        option = next(
            (o for o in group.get("options", []) if str(o.get("label", "")).strip() == label),
            None,
        )
        if option is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{label}' is not an available {group.get('name') or 'option'} for {product.name}",
            )
        if option.get("price") not in (None, ""):
            price = _money(option["price"], price)

    return VARIANT_SEPARATOR.join(parts), price
