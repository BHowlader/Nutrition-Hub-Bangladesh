"""Seed data so the storefront has products on first boot.

If the products table is empty, this inserts the original static catalog
that previously lived in frontend/lib/products.ts.
"""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.catalog import Category, Product, ProductStatus

CATEGORIES = [
    ("Gym Supplements", "gym-supplements"),
    ("Vitamins & Supplements", "vitamins-supplements"),
    ("Protein Oats", "protein-oats"),
    ("Peanut Butter", "peanut-butter"),
]

PRODUCTS = [
    # Gym Supplements › Creatine
    ("creatine-tropical-tango", "Wellcore Creatine — Tropical Tango", "Gym Supplements", "Creatine", 2500, 83, "83 Servings", "83 servings · 307g", "#F59E0B", "/images/products/creatine/tropical-tango.png", "Wellcore Micronised Creatine Monohydrate in Tropical Tango flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production."),
    ("creatine-fruit-fusion", "Wellcore Creatine — Fruit Fusion", "Gym Supplements", "Creatine", 2500, 83, "83 Servings", "83 servings · 307g", "#EC4899", "/images/products/creatine/fruit-fusion.png", "Wellcore Micronised Creatine Monohydrate in Fruit Fusion flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production."),
    ("creatine-kiwi-kick", "Wellcore Creatine — Kiwi Kick", "Gym Supplements", "Creatine", 2500, 83, "83 Servings", "83 servings · 307g", "#84CC16", "/images/products/creatine/kiwi-kick.png", "Wellcore Micronised Creatine Monohydrate in Kiwi Kick flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production."),
    ("creatine-watermelon-wave", "Wellcore Creatine — Watermelon Wave", "Gym Supplements", "Creatine", 2500, 83, "83 Servings", "83 servings · 307g", "#EF4444", "/images/products/creatine/watermelon-wave.png", "Wellcore Micronised Creatine Monohydrate in Watermelon Wave flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production."),

    # Gym Supplements › Amino Acid
    ("mb-liquid-carnitine", "MuscleBlaze Liquid L-Carnitine PRO", "Gym Supplements", "Amino Acid", 2100, 45, "1100mg L-Carnitine", "450ml · Tangy Orange", "#EF4444", "/images/products/mb-liquid-carnitine.png", "MuscleBlaze Liquid L-Carnitine PRO (Tangy Orange, 450ml). Packed with 1100mg fast-acting liquid L-Carnitine per serving for rapid fat metabolism and endurance."),

    # Vitamins & Supplements › Fish Oil & Omega 3
    ("mb-omega3-standard", "MuscleBlaze Omega 3 Fish Oil", "Vitamins & Supplements", "Fish Oil & Omega 3", 1900, 90, "90 Capsules", "90 Capsules", "#818CF8", "/images/products/mb-omega3-standard.png", "MuscleBlaze Omega 3 Fish Oil (90 Capsules). High-quality source of EPA & DHA to support cardiovascular wellness, joint flexibility, and brain function."),
    ("mb-omega3-gold", "MuscleBlaze Omega 3 Fish Oil Gold", "Vitamins & Supplements", "Fish Oil & Omega 3", 1900, 60, "Triple Strength", "60 Capsules", "#F59E0B", "/images/products/mb-omega3-gold.png", "MuscleBlaze Triple Strength Omega 3 Fish Oil Gold (60 Capsules). Ultra-pure, molecularly distilled high-potency fish oil for peak recovery and muscle wellness."),

    # Vitamins & Supplements › Multivitamin
    ("mb-vite-multivitamin", "MuscleBlaze MB-Vite Daily Multivitamin", "Vitamins & Supplements", "Multivitamin", 2200, 60, "25 Essentials", "60 Tablets", "#A78BFA", "/images/products/mb-vite-multivitamin.png", "MuscleBlaze MB-Vite Daily Multivitamin (60 Tablets) with complete blends of key vitamins, minerals, and supreme immunity boosters to power active energy."),
    ("on-multivitamin-men", "Optimum Nutrition Multivitamin for MEN", "Vitamins & Supplements", "Multivitamin", 2800, 60, "For Men", "60 Tablets", "#10B981", "/images/products/on-multivitamin-men.png", "Optimum Nutrition (ON) Multivitamin for MEN – 60 Tablets. Comprehensive daily formula tailored for active men with essential vitamins and minerals."),

    # Vitamins & Supplements › Herbal Supplements
    ("kapiva-ashwagandha-gold", "Kapiva Ashwagandha Gold", "Vitamins & Supplements", "Herbal Supplements", 2100, 60, "24k Gold", "60 Capsules", "#F59E0B", "/images/products/kapiva-ashwagandha.png", "Kapiva Ashwagandha Gold 60 Caps. Fortified with 24k gold leaf and premium standard extracts to naturally improve sleep, reduce stress, and maximize strength."),
    ("kapiva-shilajit-gold", "Kapiva Shilajit Gold Resin", "Vitamins & Supplements", "Herbal Supplements", 3100, 40, "100% Pure Resin", "40g Resin", "#F59E0B", "/images/products/shilajit-gold.png", "Kapiva Shilajit/Shilajeet Gold Resin – 40g. Highly purified Himalayan shilajit resin enriched with 24k gold and silver for optimal physical stamina, energy, and muscle power."),

    # Protein Oats
    ("pintola-protein-oats", "PINTOLA 26g High Protein Oats", "Protein Oats", None, 2200, 50, "Dark Chocolate", "1kg · Dark Chocolate", "#93C5FD", "/images/products/pintola-oats.png", "PINTOLA 26g High Protein Oats 1kg, Dark Chocolate. Loaded with clean rolled oats and fast-absorbing protein isolate to power your morning workouts."),
    ("pintola-masala-oats", "PINTOLA 26g High Protein Masala Oats", "Protein Oats", None, 2200, 50, "Spiced Masala", "1kg · Spiced Masala", "#F97316", "/images/products/pintola-masala-oats.png", "PINTOLA 26g High Protein Masala Oats 1kg. Spiced masala oats with high protein content for a savory, nutritious breakfast option."),
    ("pintola-muesli", "Pintola High Protein Muesli Dark Chocolate & Cranberry", "Protein Oats", None, 2200, 50, "Dark Chocolate & Cranberry", "1kg · Dark Chocolate & Cranberry", "#E11D48", "/images/products/pintola-muesli.png", "Pintola High Protein Muesli Dark Chocolate & Cranberry 1kg. A crunchy blend of oats, nuts, and cranberries with dark chocolate and high protein content."),

    # Peanut Butter
    ("pintola-peanut-butter-crunchy", "PINTOLA High Protein Peanut Butter Crunchy", "Peanut Butter", None, 1700, 50, "Chocolate Crunchy", "1kg · Chocolate Crunchy", "#F59E0B", "/images/products/pintola-peanut-butter.png", "PINTOLA High Protein Peanut Butter Chocolate Flavour Crunchy 1kg. Clean, rich roasted peanuts with zero hydrogenated oils and high protein concentration."),
    ("pintola-peanut-butter-creamy", "PINTOLA High Protein Peanut Butter Creamy", "Peanut Butter", None, 1700, 50, "Chocolate Creamy", "1kg · Chocolate Creamy", "#D97706", "/images/products/pintola-pb-creamy.png", "PINTOLA High Protein Peanut Butter Chocolate Flavour Creamy 1kg. Smooth and rich peanut butter with high protein and zero hydrogenated oils."),
    ("pintola-peanut-butter-crispy", "Pintola High Protein Dark Chocolate Peanut Butter Crispy", "Peanut Butter", None, 1700, 50, "Dark Chocolate Crispy", "1kg · Dark Chocolate Crispy", "#78350F", "/images/products/pintola-pb-crispy.png", "Pintola High Protein Dark Chocolate Peanut Butter Crispy 1kg. Premium dark chocolate crispy peanut butter with high protein for a rich, crunchy experience."),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Category).count() == 0:
        for name, slug in CATEGORIES:
            db.add(Category(name=name, slug=slug))
        db.commit()

    if db.query(Product).count() > 0:
        return

    cat_by_name = {c.name: c for c in db.query(Category).all()}

    for slug, name, cat_name, subcat, price, stock, badge, detail, accent, image, desc in PRODUCTS:
        cat = cat_by_name.get(cat_name)
        if not cat:
            continue
        db.add(
            Product(
                slug=slug,
                sku=slug.upper(),
                name=name,
                description=desc,
                price=Decimal(price),
                stock=stock,
                badge=badge,
                detail=detail,
                accent=accent,
                subcategory=subcat,
                image_url=image,
                status=ProductStatus.published,
                category_id=cat.id,
            )
        )
    db.commit()
