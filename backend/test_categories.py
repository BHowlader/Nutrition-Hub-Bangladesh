"""Self-check for category rename/delete guards — the two ways an admin edit could
corrupt the catalog (orphaned products, duplicate names).
Run with: .venv/bin/python test_categories.py
"""

from types import SimpleNamespace

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api import categories as api
from app.core.database import Base
from app.models import order  # noqa: F401 — User.orders needs Order mapped before configure
from app.models.catalog import Category, Product, ProductStatus
from app.schemas.catalog import CategoryUpdate

# The rate-limit and CSRF wrappers need a real ASGI request; neither is what we're testing.
api.require_trusted_admin_origin = lambda request: None
update_category = getattr(api.update_category, "__wrapped__", api.update_category)
delete_category = getattr(api.delete_category, "__wrapped__", api.delete_category)

REQUEST = SimpleNamespace(headers={}, client=SimpleNamespace(host="127.0.0.1"))
ADMIN = None  # write_audit_log accepts a null actor


def status_of(fn, *args) -> int:
    """Call `fn` expecting it to reject, and return the HTTP status it raised."""
    try:
        fn(*args)
    except HTTPException as exc:
        return exc.status_code
    raise AssertionError("expected an HTTPException")


def fresh_db() -> Session:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = Session(engine)
    db.add_all(
        [
            Category(id="c1", name="Gym Supplements", slug="gym-supplements"),
            Category(id="c2", name="Peanut Butter", slug="peanut-butter"),
        ]
    )
    db.commit()
    return db


def add_product(db: Session, category_id: str) -> None:
    db.add(
        Product(
            id="p1",
            name="Whey",
            slug="whey",
            sku="WHEY-1",
            description="x",
            price=1000,
            stock=1,
            category_id=category_id,
            status=ProductStatus.published,
        )
    )
    db.commit()


def test_rename_updates_name_and_slug():
    db = fresh_db()
    updated = update_category(REQUEST, "c1", CategoryUpdate(name="Gym Fuel", slug="gym-fuel"), db, ADMIN)
    assert (updated.name, updated.slug) == ("Gym Fuel", "gym-fuel")


def test_rename_onto_an_existing_name_is_a_conflict():
    db = fresh_db()
    assert status_of(update_category, REQUEST, "c1", CategoryUpdate(name="Peanut Butter"), db, ADMIN) == 409


def test_delete_removes_an_unused_category():
    db = fresh_db()
    delete_category(REQUEST, "c2", db, ADMIN)
    assert db.get(Category, "c2") is None


def test_delete_is_blocked_while_products_still_point_at_it():
    db = fresh_db()
    add_product(db, "c1")
    assert status_of(delete_category, REQUEST, "c1", db, ADMIN) == 409
    assert db.get(Category, "c1") is not None


def test_delete_of_a_missing_category_is_404():
    db = fresh_db()
    assert status_of(delete_category, REQUEST, "nope", db, ADMIN) == 404


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all category guards pass")
