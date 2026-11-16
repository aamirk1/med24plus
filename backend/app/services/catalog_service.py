import re
import uuid
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product, ProductAttribute, ProductImage
from app.repositories.brand_repository import BrandRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.catalog import (
    BrandCreate,
    BrandUpdate,
    CategoryCreate,
    CategoryUpdate,
    ProductCreate,
    ProductDetailResponse,
    ProductListItemResponse,
    ProductUpdate,
)
from app.services.storage_service import storage_service


def slugify(text: str) -> str:
    """Generate a URL-safe lowercase slug from arbitrary text."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


class CatalogService:
    """Domain service orchestrating Product Master Catalog, Categories, and Brands."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.category_repo = CategoryRepository(db)
        self.brand_repo = BrandRepository(db)
        self.product_repo = ProductRepository(db)

    # ==========================================================================
    # Categories
    # ==========================================================================

    async def list_categories(
        self,
        is_active: Optional[bool] = None,
        parent_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        only_root: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Category], int]:
        return await self.category_repo.list_categories(
            is_active=is_active,
            parent_id=parent_id,
            search=search,
            only_root=only_root,
            page=page,
            page_size=page_size,
        )

    async def get_category(self, category_id: uuid.UUID) -> Category:
        category = await self.category_repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Category not found.",
                    "error": {"code": "CATEGORY_NOT_FOUND"},
                },
            )
        return category

    async def create_category(self, data: CategoryCreate) -> Category:
        slug = data.slug or slugify(data.name)
        existing_slug = await self.category_repo.get_by_slug(slug)
        if existing_slug:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        if data.parent_id:
            parent = await self.category_repo.get_by_id(data.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Specified parent category does not exist.",
                        "error": {"code": "PARENT_CATEGORY_NOT_FOUND"},
                    },
                )

        category = Category(
            name=data.name.strip(),
            slug=slug,
            description=data.description,
            image_url=data.image_url,
            parent_id=data.parent_id,
            sort_order=data.sort_order,
            is_active=data.is_active,
        )
        return await self.category_repo.create(category)

    async def update_category(self, category_id: uuid.UUID, data: CategoryUpdate) -> Category:
        category = await self.get_category(category_id)

        if data.name is not None:
            category.name = data.name.strip()
        if data.slug is not None:
            existing = await self.category_repo.get_by_slug(data.slug)
            if existing and existing.id != category_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Slug is already in use by another category.",
                        "error": {"code": "SLUG_ALREADY_EXISTS"},
                    },
                )
            category.slug = slugify(data.slug)
        if data.description is not None:
            category.description = data.description
        if data.image_url is not None:
            category.image_url = data.image_url
        if data.sort_order is not None:
            category.sort_order = data.sort_order
        if data.is_active is not None:
            category.is_active = data.is_active

        if data.parent_id is not None:
            if data.parent_id == category_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Category cannot be its own parent.",
                        "error": {"code": "CIRCULAR_CATEGORY_PARENT"},
                    },
                )
            is_circular = await self.category_repo.has_circular_parent(category_id, data.parent_id)
            if is_circular:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Circular category ancestry detected.",
                        "error": {"code": "CIRCULAR_CATEGORY_PARENT"},
                    },
                )
            category.parent_id = data.parent_id

        return await self.category_repo.update(category)

    async def set_category_status(self, category_id: uuid.UUID, is_active: bool) -> Category:
        category = await self.get_category(category_id)
        category.is_active = is_active
        return await self.category_repo.update(category)

    async def delete_category(self, category_id: uuid.UUID) -> None:
        category = await self.get_category(category_id)
        product_count = await self.category_repo.count_products_in_category(category_id)
        if product_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Cannot delete category: {product_count} active product(s) are assigned to it. Reassign or delete products first.",
                    "error": {"code": "CATEGORY_HAS_PRODUCTS"},
                },
            )
        category.is_deleted = True
        category.is_active = False
        await self.category_repo.update(category)

    # ==========================================================================
    # Brands
    # ==========================================================================

    async def list_brands(
        self,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Brand], int]:
        return await self.brand_repo.list_brands(
            is_active=is_active,
            search=search,
            page=page,
            page_size=page_size,
        )

    async def get_brand(self, brand_id: uuid.UUID) -> Brand:
        brand = await self.brand_repo.get_by_id(brand_id)
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Brand not found.",
                    "error": {"code": "BRAND_NOT_FOUND"},
                },
            )
        return brand

    async def create_brand(self, data: BrandCreate) -> Brand:
        slug = data.slug or slugify(data.name)
        existing = await self.brand_repo.get_by_name(data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": "A brand with this name already exists.",
                    "error": {"code": "BRAND_ALREADY_EXISTS"},
                },
            )

        existing_slug = await self.brand_repo.get_by_slug(slug)
        if existing_slug:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        brand = Brand(
            name=data.name.strip(),
            slug=slug,
            manufacturer_name=data.manufacturer_name.strip(),
            logo_url=data.logo_url,
            description=data.description,
            country_of_origin=data.country_of_origin,
            is_active=data.is_active,
        )
        return await self.brand_repo.create(brand)

    async def update_brand(self, brand_id: uuid.UUID, data: BrandUpdate) -> Brand:
        brand = await self.get_brand(brand_id)

        if data.name is not None:
            existing = await self.brand_repo.get_by_name(data.name)
            if existing and existing.id != brand_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "A brand with this name already exists.",
                        "error": {"code": "BRAND_ALREADY_EXISTS"},
                    },
                )
            brand.name = data.name.strip()

        if data.slug is not None:
            existing_slug = await self.brand_repo.get_by_slug(data.slug)
            if existing_slug and existing_slug.id != brand_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Slug is already used by another brand.",
                        "error": {"code": "SLUG_ALREADY_EXISTS"},
                    },
                )
            brand.slug = slugify(data.slug)

        if data.manufacturer_name is not None:
            brand.manufacturer_name = data.manufacturer_name.strip()
        if data.logo_url is not None:
            brand.logo_url = data.logo_url
        if data.description is not None:
            brand.description = data.description
        if data.country_of_origin is not None:
            brand.country_of_origin = data.country_of_origin
        if data.is_active is not None:
            brand.is_active = data.is_active

        return await self.brand_repo.update(brand)

    async def set_brand_status(self, brand_id: uuid.UUID, is_active: bool) -> Brand:
        brand = await self.get_brand(brand_id)
        brand.is_active = is_active
        return await self.brand_repo.update(brand)

    async def delete_brand(self, brand_id: uuid.UUID) -> None:
        brand = await self.get_brand(brand_id)
        product_count = await self.brand_repo.count_products_in_brand(brand_id)
        if product_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Cannot delete brand: {product_count} product(s) reference it. Reassign or delete products first.",
                    "error": {"code": "BRAND_HAS_PRODUCTS"},
                },
            )
        brand.is_deleted = True
        brand.is_active = False
        await self.brand_repo.update(brand)

    # ==========================================================================
    # Products
    # ==========================================================================

    @staticmethod
    def calculate_discount_percent(mrp: Decimal, selling_price: Decimal) -> Decimal:
        """Compute accurate discount percentage based on MRP and Selling Price."""
        if mrp <= 0 or selling_price >= mrp:
            return Decimal("0.00")
        diff = mrp - selling_price
        pct = (diff / mrp) * Decimal("100")
        return Decimal(round(pct, 2))

    async def create_product(self, data: ProductCreate) -> Product:
        # 1. Validate Category and Brand existence
        category = await self.category_repo.get_by_id(data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Referenced category does not exist.", "error": {"code": "CATEGORY_NOT_FOUND"}},
            )

        brand = await self.brand_repo.get_by_id(data.brand_id)
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Referenced brand does not exist.", "error": {"code": "BRAND_NOT_FOUND"}},
            )

        # 2. Check SKU Uniqueness
        existing_sku = await self.product_repo.get_by_sku(data.sku)
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": f"Product SKU '{data.sku}' already exists.", "error": {"code": "SKU_ALREADY_EXISTS"}},
            )

        # 3. Generate and check Slug
        slug = data.slug or slugify(data.name)
        existing_slug = await self.product_repo.get_by_slug(slug)
        if existing_slug:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        # 4. Calculate discount
        discount_percent = self.calculate_discount_percent(data.mrp, data.selling_price)

        product = Product(
            name=data.name.strip(),
            slug=slug,
            sku=data.sku.strip(),
            generic_name=data.generic_name.strip(),
            composition=data.composition,
            category_id=data.category_id,
            brand_id=data.brand_id,
            manufacturer=data.manufacturer.strip(),
            marketer=data.marketer,
            description=data.description,
            pack_size=data.pack_size.strip(),
            dosage_form=data.dosage_form.strip(),
            strength=data.strength,
            route_of_administration=data.route_of_administration,
            storage_temperature=data.storage_temperature,
            is_cold_chain=data.is_cold_chain,
            requires_prescription=data.requires_prescription,
            schedule_classification=data.schedule_classification,
            is_restricted=data.is_restricted,
            mrp=data.mrp,
            selling_price=data.selling_price,
            discount_percent=discount_percent,
            hsn_code=data.hsn_code.strip(),
            gst_rate=data.gst_rate,
            is_active=data.is_active,
        )

        # Handle initial images if supplied
        if data.images:
            for img in data.images:
                product.images.append(
                    ProductImage(
                        image_url=img.image_url,
                        alt_text=img.alt_text,
                        is_primary=img.is_primary,
                        sort_order=img.sort_order,
                    )
                )

        # Handle initial attributes
        if data.attributes:
            for attr in data.attributes:
                product.attributes.append(
                    ProductAttribute(
                        attribute_key=attr.attribute_key,
                        attribute_value=attr.attribute_value,
                    )
                )

        return await self.product_repo.create(product)

    async def update_product(self, product_id: uuid.UUID, data: ProductUpdate) -> Product:
        product = await self.product_repo.get_by_id(product_id, load_relations=True)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product not found.", "error": {"code": "PRODUCT_NOT_FOUND"}},
            )

        if data.sku is not None and data.sku != product.sku:
            existing = await self.product_repo.get_by_sku(data.sku)
            if existing and existing.id != product_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"success": False, "message": "SKU already in use.", "error": {"code": "SKU_ALREADY_EXISTS"}},
                )
            product.sku = data.sku.strip()

        if data.slug is not None and data.slug != product.slug:
            existing_slug = await self.product_repo.get_by_slug(data.slug)
            if existing_slug and existing_slug.id != product_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"success": False, "message": "Slug already in use.", "error": {"code": "SLUG_ALREADY_EXISTS"}},
                )
            product.slug = slugify(data.slug)

        if data.category_id is not None:
            cat = await self.category_repo.get_by_id(data.category_id)
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"success": False, "message": "Category not found.", "error": {"code": "CATEGORY_NOT_FOUND"}},
                )
            product.category_id = data.category_id

        if data.brand_id is not None:
            br = await self.brand_repo.get_by_id(data.brand_id)
            if not br:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"success": False, "message": "Brand not found.", "error": {"code": "BRAND_NOT_FOUND"}},
                )
            product.brand_id = data.brand_id

        # Update scalar fields
        fields = [
            "name", "generic_name", "composition", "manufacturer", "marketer",
            "description", "pack_size", "dosage_form", "strength", "route_of_administration",
            "storage_temperature", "is_cold_chain", "requires_prescription",
            "schedule_classification", "is_restricted", "hsn_code", "gst_rate", "is_active",
        ]
        for field in fields:
            val = getattr(data, field)
            if val is not None:
                setattr(product, field, val)

        # Price updates and discount recomputation
        new_mrp = data.mrp if data.mrp is not None else product.mrp
        new_selling = data.selling_price if data.selling_price is not None else product.selling_price
        if new_selling > new_mrp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Selling price cannot exceed Maximum Retail Price (MRP).", "error": {"code": "INVALID_PRICE"}},
            )
        product.mrp = new_mrp
        product.selling_price = new_selling
        product.discount_percent = self.calculate_discount_percent(new_mrp, new_selling)

        return await self.product_repo.update(product)

    async def set_product_status(self, product_id: uuid.UUID, is_active: bool) -> Product:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product not found.", "error": {"code": "PRODUCT_NOT_FOUND"}},
            )
        product.is_active = is_active
        return await self.product_repo.update(product)

    async def delete_product(self, product_id: uuid.UUID) -> None:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product not found.", "error": {"code": "PRODUCT_NOT_FOUND"}},
            )
        order_refs = await self.product_repo.count_order_references(product_id)
        if order_refs > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Cannot delete product with {order_refs} historical order line items. Deactivate it instead.",
                    "error": {"code": "PRODUCT_REFERENCED_IN_ORDERS"},
                },
            )
        product.is_deleted = True
        product.is_active = False
        await self.product_repo.update(product)

    async def get_product_detail(self, product_id: uuid.UUID) -> ProductDetailResponse:
        product = await self.product_repo.get_by_id(product_id, load_relations=True)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product not found.", "error": {"code": "PRODUCT_NOT_FOUND"}},
            )
        stock_map = await self.product_repo.get_sellable_stock_for_products([product.id])
        sellable = stock_map.get(product.id, 0)

        resp = ProductDetailResponse.model_validate(product)
        resp.sellable_quantity = sellable
        resp.is_in_stock = bool(sellable > 0)
        return resp

    async def get_product_by_slug(self, slug: str) -> ProductDetailResponse:
        product = await self.product_repo.get_by_slug(slug, load_relations=True)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product not found.", "error": {"code": "PRODUCT_NOT_FOUND"}},
            )
        stock_map = await self.product_repo.get_sellable_stock_for_products([product.id])
        sellable = stock_map.get(product.id, 0)

        resp = ProductDetailResponse.model_validate(product)
        resp.sellable_quantity = sellable
        resp.is_in_stock = bool(sellable > 0)
        return resp

    async def list_products(
        self,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        brand_id: Optional[uuid.UUID] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        prescription_required: Optional[bool] = None,
        dosage_form: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "newest",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[ProductListItemResponse], int]:
        products, total_items = await self.product_repo.list_products(
            search=search,
            category_id=category_id,
            brand_id=brand_id,
            min_price=min_price,
            max_price=max_price,
            prescription_required=prescription_required,
            dosage_form=dosage_form,
            is_active=is_active,
            sort_by=sort_by,
            page=page,
            page_size=page_size,
        )

        p_ids = [p.id for p in products]
        stock_map = await self.product_repo.get_sellable_stock_for_products(p_ids)

        items = []
        for p in products:
            sellable = stock_map.get(p.id, 0)
            primary_img = next((img.image_url for img in p.images if img.is_primary), None)
            if not primary_img and p.images:
                primary_img = p.images[0].image_url

            items.append(
                ProductListItemResponse(
                    id=p.id,
                    name=p.name,
                    slug=p.slug,
                    sku=p.sku,
                    generic_name=p.generic_name,
                    category_id=p.category_id,
                    category_name=p.category.name if p.category else None,
                    brand_id=p.brand_id,
                    brand_name=p.brand.name if p.brand else None,
                    pack_size=p.pack_size,
                    dosage_form=p.dosage_form,
                    strength=p.strength,
                    requires_prescription=p.requires_prescription,
                    schedule_classification=p.schedule_classification,
                    is_restricted=p.is_restricted,
                    mrp=p.mrp,
                    selling_price=p.selling_price,
                    discount_percent=p.discount_percent,
                    is_active=p.is_active,
                    primary_image_url=primary_img,
                    is_in_stock=bool(sellable > 0),
                    sellable_quantity=sellable,
                    created_at=p.created_at,
                )
            )

        return items, total_items

    # ==========================================================================
    # Product Images
    # ==========================================================================

    async def upload_product_image(
        self,
        product_id: uuid.UUID,
        file: UploadFile,
        alt_text: Optional[str] = None,
        is_primary: bool = False,
        sort_order: int = 0,
    ) -> ProductImage:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product not found.", "error": {"code": "PRODUCT_NOT_FOUND"}},
            )

        image_url = await storage_service.save_product_image(file, product_id)

        # If product has no images yet, make this one primary automatically
        if not product.images:
            is_primary = True

        img = ProductImage(
            product_id=product_id,
            image_url=image_url,
            alt_text=alt_text or product.name,
            is_primary=is_primary,
            sort_order=sort_order,
        )
        return await self.product_repo.add_image(img)

    async def set_primary_product_image(self, product_id: uuid.UUID, image_id: uuid.UUID) -> ProductImage:
        img = await self.product_repo.get_image_by_id(image_id)
        if not img or img.product_id != product_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product image not found.", "error": {"code": "IMAGE_NOT_FOUND"}},
            )
        updated_img = await self.product_repo.set_primary_image(product_id, image_id)
        return updated_img or img

    async def delete_product_image(self, product_id: uuid.UUID, image_id: uuid.UUID) -> None:
        img = await self.product_repo.get_image_by_id(image_id)
        if not img or img.product_id != product_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Product image not found.", "error": {"code": "IMAGE_NOT_FOUND"}},
            )
        await storage_service.delete_image(img.image_url)
        await self.product_repo.delete_image(img)

