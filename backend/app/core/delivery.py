"""Pathao delivery charges.

Rates from https://help.pathao.com/what-is-the-delivery-charge-inside-or-outside-the-city/
(pickup from Dhaka), weight brackets 0-200g / 0-500g / 500g-1kg / 1kg-2kg:

    Inside Dhaka    60 / 60 / 70 /  90
    Sub-urban       80 / 80 / 100 / 130
    Outside Dhaka  110 / 110 / 130 / 170

ponytail: one rate per zone, at Pathao's 1kg-2kg bracket. Products carry no
weight, and a single supplement tub already lands in that bracket, so this is
the bracket that bills correctly for an ordinary order and never undercharges
below 2kg. Add a weight column on Product and bracket the sum per order if the
lighter (60/70) tiers are worth billing, or if orders routinely pass 2kg —
Pathao bills per extra kg above that.
"""

from decimal import Decimal

DELIVERY_CHARGES: dict[str, Decimal] = {
    "inside_dhaka": Decimal("90"),
    "sub_urban": Decimal("130"),
    "outside_dhaka": Decimal("170"),
}

# Anchors the OrderCreate.delivery_zone pattern, so the schema and the rates
# can't drift apart.
DELIVERY_ZONE_PATTERN = "^(" + "|".join(DELIVERY_CHARGES) + ")$"

DEFAULT_DELIVERY_ZONE = "inside_dhaka"


def delivery_charge(zone: str | None) -> Decimal:
    """Charge for a zone. Unknown/missing zones fall back to Dhaka's rate —
    the schema pattern has already rejected anything else."""
    return DELIVERY_CHARGES.get(zone or DEFAULT_DELIVERY_ZONE, DELIVERY_CHARGES[DEFAULT_DELIVERY_ZONE])
