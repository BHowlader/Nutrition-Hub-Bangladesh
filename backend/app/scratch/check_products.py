from app.core.database import SessionLocal
from app.models.catalog import Product

db = SessionLocal()
try:
    products = db.query(Product).all()
    for p in products:
        print(f"ID: {p.id}, Name: {p.name}, Image URL: {p.image_url}")
finally:
    db.close()
