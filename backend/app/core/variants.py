"""Product variants — option groups stored as JSON on the product row.

Shape (as persisted in `products.variants`):

    [{"name": "Size",   "options": [{"label": "500g", "price": "1000", "stock": 12, "description": null, "image_url": null},
                                    {"label": "1kg",  "price": "1800", "stock": null, "description": "Bulk tub", "image_url": "https://…"}]},
     {"name": "Flavor", "options": [{"label": "Strawberry", "price": null, "stock": 0, "description": null, "image_url": null}]}]

`price` is the option's OWN price, not an adjustment to the product price. A null
price means "use the product price". When more than one chosen option carries a
price, the last group wins — groups are read in order, so put the pricing axis
(usually Size) last if a product ever prices on two axes. `description` and
`image_url` follow the same last-wins rule, but the storefront resolves those —
only price is re-derived server-side.

A customer's choice travels as ONE human-readable string built by joining the
chosen labels in group order: "1kg / Strawberry". That single string is the cart
line key, what the admin reads off the order, and what we re-price against.
Labels are rejected at write time if they contain "/", which keeps the split
unambiguous without needing a second identifier column.

`stock` is that option's own pool, so one flavour can sell out while its siblings
keep selling. Null means "no separate pool" and the product-level stock applies —
which is what every product written before this field existed stores.
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
                    "stock": option.stock,
                    "description": option.description or None,
                    "image_url": option.image_url or None,
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


def option_stock(option: dict) -> int | None:
    """The option's own stock, or None when it doesn't declare one."""
    raw = option.get("stock")
    if raw is None or str(raw).strip() == "":
        return None
    try:
        return max(int(raw), 0)
    except (ValueError, TypeError):
        return None


def chosen_options(product, variant: str | None) -> list[dict]:
    """Validate a customer's variant choice and return the option dicts they picked.

    Empty when the product has no variants. The dicts are the live entries inside
    `product.variants`, so callers holding a locked row can decrement them in place.
    """
    groups = _groups(product)
    if not groups:
        # Products without variants ignore whatever the client sent.
        return []

    chosen = (variant or "").strip()
    parts = [part.strip() for part in chosen.split(VARIANT_SEPARATOR)] if chosen else []
    if len(parts) != len(groups):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Choose an option for every {product.name} variant",
        )

    picked = []
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
        picked.append(option)
    return picked


def resolve_variant(product, variant: str | None) -> tuple[str | None, Decimal]:
    """Validate a customer's variant choice and price it.

    Returns the canonical variant string (None when the product has no variants)
    and the authoritative unit price. The client never supplies a price.
    """
    options = chosen_options(product, variant)
    if not options:
        return None, Decimal(product.price)

    price = Decimal(product.price)
    for option in options:
        if option.get("price") not in (None, ""):
            price = _money(option["price"], price)

    return VARIANT_SEPARATOR.join(str(o.get("label", "")).strip() for o in options), price


def variant_stock(product, variant: str | None) -> int:
    """Units of this exact choice a customer can still buy.

    An option that declares its own stock IS the pool for every choice containing
    it, so a two-group choice is capped by its scarcest half. The product-level
    number is the fallback, used only when no chosen option declares one.
    """
    declared = [stock for stock in map(option_stock, chosen_options(product, variant)) if stock is not None]
    return min(declared) if declared else int(product.stock)
