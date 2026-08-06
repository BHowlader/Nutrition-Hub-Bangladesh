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


class CategoryImagesRead(BaseModel):
    category_image_1: str | None = None
    category_image_2: str | None = None
    category_image_3: str | None = None
    category_image_4: str | None = None
    category_name_1: str | None = None
    category_name_2: str | None = None
    category_name_3: str | None = None
    category_name_4: str | None = None

    model_config = {"from_attributes": True}


class CategoryImagesUpdate(BaseModel):
    category_image_1: str | None = Field(default=None, max_length=500)
    category_image_2: str | None = Field(default=None, max_length=500)
    category_image_3: str | None = Field(default=None, max_length=500)
    category_image_4: str | None = Field(default=None, max_length=500)
    category_name_1: str | None = Field(default=None, max_length=120)
    category_name_2: str | None = Field(default=None, max_length=120)
    category_name_3: str | None = Field(default=None, max_length=120)
    category_name_4: str | None = Field(default=None, max_length=120)
