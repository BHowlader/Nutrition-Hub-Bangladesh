"""Pathao delivery charges, derived from the delivery address.

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

The customer never sends a zone: they pick a division and an area, and the
zone (and so the price) is looked up here. Anything a customer can name is in
AREA_ZONES, so an address can't be talked into a cheaper rate.
"""

from decimal import Decimal

from fastapi import HTTPException, status

DELIVERY_CHARGES: dict[str, Decimal] = {
    "inside_dhaka": Decimal("90"),
    "sub_urban": Decimal("130"),
    "outside_dhaka": Decimal("170"),
}

ZONE_LABELS = {
    "inside_dhaka": "Inside Dhaka",
    "sub_urban": "Sub-urban",
    "outside_dhaka": "Outside Dhaka",
}

# Dhaka city thanas — Pathao's "Inside Dhaka".
DHAKA_CITY = (
    "Adabor", "Badda", "Banani", "Bangshal", "Bhashantek", "Cantonment", "Chawkbazar",
    "Dakshinkhan", "Darus Salam", "Demra", "Dhanmondi", "Gendaria", "Gulshan", "Hazaribagh",
    "Jatrabari", "Kadamtali", "Kafrul", "Kalabagan", "Kamrangirchar", "Khilgaon", "Khilkhet",
    "Kotwali", "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "Mugda", "New Market",
    "Pallabi", "Paltan", "Ramna", "Rampura", "Sabujbagh", "Shah Ali", "Shahbagh",
    "Shahjahanpur", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon", "Turag",
    "Uttara", "Uttarkhan", "Vatara", "Wari",
)

# The ring around the city — Pathao's "Sub-urban".
# ponytail: one entry per town, not per upazila, so a far corner of Gazipur bills
# as Gazipur. Split an entry out to outside_dhaka if a real Pathao invoice disagrees;
# this table is the only thing to edit.
DHAKA_SUBURBS = (
    "Ashulia", "Dhamrai", "Dohar", "Gazipur", "Keraniganj", "Munshiganj", "Nawabganj",
    "Narayanganj", "Rupganj", "Savar", "Siddhirganj", "Sonargaon", "Tongi",
)

# Everything else, by division — district level is enough, the street address
# carries the rest and the rate is flat outside Dhaka either way.
OTHER_AREAS: dict[str, tuple[str, ...]] = {
    "Dhaka": (
        "Faridpur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Narsingdi",
        "Rajbari", "Shariatpur", "Tangail",
    ),
    "Barishal": ("Barguna", "Barishal", "Bhola", "Jhalokathi", "Patuakhali", "Pirojpur"),
    "Chattogram": (
        "Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cox's Bazar", "Cumilla",
        "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati",
    ),
    "Khulna": (
        "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura",
        "Meherpur", "Narail", "Satkhira",
    ),
    "Mymensingh": ("Jamalpur", "Mymensingh", "Netrokona", "Sherpur"),
    "Rajshahi": (
        "Bogura", "Chapai Nawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna",
        "Rajshahi", "Sirajganj",
    ),
    "Rangpur": (
        "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh",
        "Rangpur", "Thakurgaon",
    ),
    "Sylhet": ("Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"),
}

# (division, area) -> zone. Dhaka is listed city-first so the dropdown opens on
# the areas most customers want.
AREA_ZONES: dict[tuple[str, str], str] = {
    **{("Dhaka", area): "inside_dhaka" for area in DHAKA_CITY},
    **{("Dhaka", area): "sub_urban" for area in DHAKA_SUBURBS},
    **{
        (division, area): "outside_dhaka"
        for division, areas in OTHER_AREAS.items()
        for area in areas
    },
}


def divisions() -> list[dict]:
    """The dropdown data: divisions, each with its areas and what they cost."""
    ordered: dict[str, list[dict]] = {}
    for (division, area), zone in AREA_ZONES.items():
        ordered.setdefault(division, []).append(
            {"name": area, "zone": zone, "charge": str(DELIVERY_CHARGES[zone])}
        )
    return [{"name": division, "areas": areas} for division, areas in ordered.items()]


def zone_for(division: str, area: str) -> str:
    """Zone for a delivery address. Rejects anything not in the table — the
    customer picks a place, never a price."""
    zone = AREA_ZONES.get(((division or "").strip(), (area or "").strip()))
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"We do not deliver to {area or '—'}, {division or '—'}",
        )
    return zone


def delivery_charge(zone: str) -> Decimal:
    return DELIVERY_CHARGES[zone]
