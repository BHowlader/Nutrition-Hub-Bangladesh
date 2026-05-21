from pydantic import BaseModel, Field


class HeroSettingsRead(BaseModel):
    hero_description: str
    hero_product_slug_1: str | None = None
    hero_product_slug_2: str | None = None
    hero_product_slug_3: str | None = None

    model_config = {"from_attributes": True}


class HeroSettingsUpdate(BaseModel):
    hero_description: str = Field(min_length=1, max_length=1000)
    hero_product_slug_1: str | None = Field(default=None, max_length=220)
    hero_product_slug_2: str | None = Field(default=None, max_length=220)
    hero_product_slug_3: str | None = Field(default=None, max_length=220)
