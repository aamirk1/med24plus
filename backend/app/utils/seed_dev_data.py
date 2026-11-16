"""Med24Plus Safe Development Seed Script.

Seeds fictional demonstration categories, brands, products, batches, and system roles.
- All records are clearly identified as fictional demo data.
- Zero real customer personal data or live prescriptions are seeded.
- Restricted medicines (Schedule X) are flagged as non-purchasable.
- Idempotent and safe to run multiple times without creating duplicates.
"""

import sys
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.models.base import Base
from app.models.brand import Brand
from app.models.category import Category
from app.models.inventory import Inventory, InventoryBatch, StockAlert, StockMovement
from app.models.product import Product, ProductAttribute, ProductImage
from app.models.role import Permission, Role, RolePermission


def seed_data_sync(session: Session) -> Dict[str, int]:
    """Execute synchronous database seeding using existing SQLAlchemy session."""
    stats = {
        "roles": 0,
        "permissions": 0,
        "categories": 0,
        "brands": 0,
        "products": 0,
        "batches": 0,
        "inventory": 0,
    }

    # 1. System Roles
    roles_data = [
        ("customer", "customer", "Standard patient and customer user account", True),
        ("pharmacist", "pharmacist", "Registered Pharmacist under D&C Act with Rx review privileges", True),
        ("inventory_manager", "inventory_manager", "Warehouse stockkeeper with batch receipt & audit privileges", True),
        ("admin", "admin", "System administrator with full operational oversight", True),
        ("delivery_agent", "delivery_agent", "Logistics delivery personnel with OTP verification privileges", True),
    ]

    roles_map: Dict[str, Role] = {}
    for name, slug, desc, is_sys in roles_data:
        existing = session.execute(select(Role).where(Role.slug == slug)).scalar_one_or_none()
        if not existing:
            role = Role(name=name, slug=slug, description=desc, is_system_role=is_sys)
            session.add(role)
            session.flush()
            roles_map[slug] = role
            stats["roles"] += 1
        else:
            roles_map[slug] = existing

    # 2. Granular Permissions
    permissions_data = [
        ("prescriptions:review", "prescriptions:review", "prescriptions", "Ability to review and verify doctor prescriptions"),
        ("prescriptions:reject", "prescriptions:reject", "prescriptions", "Ability to reject prescriptions with clinical reasoning"),
        ("catalog:read", "catalog:read", "catalog", "View pharmaceutical catalog"),
        ("catalog:manage", "catalog:manage", "catalog", "Create and modify pharmaceutical catalog items"),
        ("inventory:receive_batches", "inventory:receive_batches", "inventory", "Inward new medication batches"),
        ("inventory:adjust_stock", "inventory:adjust_stock", "inventory", "Request and authorize stock adjustments"),
        ("orders:view_all", "orders:view_all", "orders", "View all customer orders and invoices"),
        ("orders:pack_dispatch", "orders:pack_dispatch", "orders", "Pack and dispatch medication orders"),
        ("audit:view_compliance", "audit:view_compliance", "audit", "Inspect statutory dispensing audit logs"),
    ]

    for name, slug, module, desc in permissions_data:
        existing_perm = session.execute(select(Permission).where(Permission.slug == slug)).scalar_one_or_none()
        if not existing_perm:
            perm = Permission(name=name, slug=slug, module=module, description=desc)
            session.add(perm)
            session.flush()
            stats["permissions"] += 1

            # Assign to admin and relevant operational roles
            if slug.startswith("prescriptions:"):
                session.add(RolePermission(role_id=roles_map["pharmacist"].id, permission_id=perm.id))
                session.add(RolePermission(role_id=roles_map["admin"].id, permission_id=perm.id))
            elif slug.startswith("inventory:"):
                session.add(RolePermission(role_id=roles_map["inventory_manager"].id, permission_id=perm.id))
                session.add(RolePermission(role_id=roles_map["admin"].id, permission_id=perm.id))
            else:
                session.add(RolePermission(role_id=roles_map["admin"].id, permission_id=perm.id))

    # 3. Fictional Categories
    categories_data = [
        ("Antibiotics & Anti-Infectives", "demo-antibiotics", "Prescription anti-bacterials, antifungals, and antivirals"),
        ("Analgesics & Antipyretics", "demo-analgesics", "Pain relief, anti-inflammatory, and fever management"),
        ("Gastrointestinal & Antacids", "demo-gastrointestinal", "Acidity, reflux, gut motility, and antiemetics"),
        ("Cardiovascular & Antihypertensives", "demo-cardiovascular", "Heart health, blood pressure, and cholesterol"),
        ("Anti-Diabetic Care", "demo-diabetic", "Insulins, oral hypoglycemics, and glucose monitoring"),
        ("Respiratory & Anti-Allergic", "demo-respiratory", "Antihistamines, bronchodilators, and cough syrups"),
        ("Vitamins, Minerals & Supplements", "demo-supplements", "Nutritional daily health and immunity boosters"),
        ("First Aid & Antiseptics", "demo-first-aid", "Wound care, dressings, and antiseptic solutions"),
    ]

    categories_map: Dict[str, Category] = {}
    for name, slug, desc in categories_data:
        existing_cat = session.execute(select(Category).where(Category.slug == slug)).scalar_one_or_none()
        if not existing_cat:
            cat = Category(
                name=name,
                slug=slug,
                description=desc,
                is_active=True,
                sort_order=len(categories_map),
            )
            session.add(cat)
            session.flush()
            categories_map[slug] = cat
            stats["categories"] += 1
        else:
            categories_map[slug] = existing_cat

    # 4. Fictional Demonstration Brands
    brands_data = [
        ("DemoPharma Laboratories", "demo-demopharma", "DemoPharma India Pvt Ltd", "Mumbai, Maharashtra"),
        ("CureWell Life Sciences (Demo)", "demo-curewell", "CureWell Healthcare Ltd", "Ahmedabad, Gujarat"),
        ("Apex MediCorp (Demo)", "demo-apex", "Apex MediCorp India Ltd", "Hyderabad, Telangana"),
        ("BioZen Formulations (Demo)", "demo-biozen", "BioZen Therapeutics Ltd", "Bengaluru, Karnataka"),
        ("Sanjeevani Health (Demo)", "demo-sanjeevani", "Sanjeevani Remedies India", "Sikkim, India"),
    ]

    brands_map: Dict[str, Brand] = {}
    for name, slug, mfg, _ in brands_data:
        existing_brand = session.execute(select(Brand).where(Brand.slug == slug)).scalar_one_or_none()
        if not existing_brand:
            brand = Brand(
                name=name,
                slug=slug,
                manufacturer_name=mfg,
                country_of_origin="India",
                is_active=True,
            )
            session.add(brand)
            session.flush()
            brands_map[slug] = brand
            stats["brands"] += 1
        else:
            brands_map[slug] = existing_brand

    # 5. Fictional Products (Demonstration records strictly compliant with Indian law)
    products_seed = [
        {
            "name": "Demo Paracetamol 650mg Tablets",
            "slug": "demo-paracetamol-650mg",
            "sku": "DEMO-PCM-650",
            "generic_name": "Paracetamol",
            "composition": "Each uncoated tablet contains: Paracetamol IP 650 mg",
            "category_slug": "demo-analgesics",
            "brand_slug": "demo-demopharma",
            "manufacturer": "DemoPharma India Pvt Ltd",
            "pack_size": "15 Tablets",
            "dosage_form": "TABLET",
            "strength": "650 mg",
            "storage_temperature": "room_temperature",
            "is_cold_chain": False,
            "requires_prescription": False,
            "schedule_classification": "OTC",
            "is_restricted": False,
            "mrp": Decimal("33.50"),
            "selling_price": Decimal("30.00"),
            "discount_percent": Decimal("10.45"),
            "hsn_code": "3004",
            "gst_rate": Decimal("12.00"),
        },
        {
            "name": "Demo Amoxicillin & Clavulanate 625mg Tablets",
            "slug": "demo-amoxicillin-clav-625mg",
            "sku": "DEMO-AMOX-625",
            "generic_name": "Amoxicillin and Potassium Clavulanate",
            "composition": "Amoxicillin Trihydrate IP eq to Amoxicillin 500 mg, Potassium Clavulanate Diluted IP eq to Clavulanic Acid 125 mg",
            "category_slug": "demo-antibiotics",
            "brand_slug": "demo-curewell",
            "manufacturer": "CureWell Healthcare Ltd",
            "pack_size": "10 Tablets",
            "dosage_form": "TABLET",
            "strength": "625 mg",
            "storage_temperature": "room_temperature",
            "is_cold_chain": False,
            "requires_prescription": True,
            "schedule_classification": "SCHEDULE_H",
            "is_restricted": False,
            "mrp": Decimal("204.50"),
            "selling_price": Decimal("175.00"),
            "discount_percent": Decimal("14.43"),
            "hsn_code": "3004",
            "gst_rate": Decimal("12.00"),
        },
        {
            "name": "Demo Pantoprazole Gastro-Resistant 40mg Tablets",
            "slug": "demo-pantoprazole-40mg",
            "sku": "DEMO-PANTO-40",
            "generic_name": "Pantoprazole Sodium",
            "composition": "Each enteric coated tablet contains: Pantoprazole Sodium IP eq to Pantoprazole 40 mg",
            "category_slug": "demo-gastrointestinal",
            "brand_slug": "demo-apex",
            "manufacturer": "Apex MediCorp India Ltd",
            "pack_size": "15 Tablets",
            "dosage_form": "TABLET",
            "strength": "40 mg",
            "storage_temperature": "room_temperature",
            "is_cold_chain": False,
            "requires_prescription": True,
            "schedule_classification": "SCHEDULE_H",
            "is_restricted": False,
            "mrp": Decimal("155.00"),
            "selling_price": Decimal("132.00"),
            "discount_percent": Decimal("14.84"),
            "hsn_code": "3004",
            "gst_rate": Decimal("12.00"),
        },
        {
            "name": "Demo Metformin Hydrochloride 500mg ER Tablets",
            "slug": "demo-metformin-500mg-er",
            "sku": "DEMO-MET-500",
            "generic_name": "Metformin Hydrochloride",
            "composition": "Each extended release tablet contains: Metformin Hydrochloride IP 500 mg",
            "category_slug": "demo-diabetic",
            "brand_slug": "demo-biozen",
            "manufacturer": "BioZen Therapeutics Ltd",
            "pack_size": "20 Tablets",
            "dosage_form": "TABLET",
            "strength": "500 mg ER",
            "storage_temperature": "room_temperature",
            "is_cold_chain": False,
            "requires_prescription": True,
            "schedule_classification": "SCHEDULE_H",
            "is_restricted": False,
            "mrp": Decimal("48.00"),
            "selling_price": Decimal("41.00"),
            "discount_percent": Decimal("14.58"),
            "hsn_code": "3004",
            "gst_rate": Decimal("12.00"),
        },
        {
            "name": "Demo Cetirizine Hydrochloride 10mg Tablets",
            "slug": "demo-cetirizine-10mg",
            "sku": "DEMO-CET-10",
            "generic_name": "Cetirizine Hydrochloride",
            "composition": "Each film coated tablet contains: Cetirizine Dihydrochloride IP 10 mg",
            "category_slug": "demo-respiratory",
            "brand_slug": "demo-demopharma",
            "manufacturer": "DemoPharma India Pvt Ltd",
            "pack_size": "10 Tablets",
            "dosage_form": "TABLET",
            "strength": "10 mg",
            "storage_temperature": "room_temperature",
            "is_cold_chain": False,
            "requires_prescription": True,
            "schedule_classification": "SCHEDULE_H",
            "is_restricted": False,
            "mrp": Decimal("22.00"),
            "selling_price": Decimal("18.50"),
            "discount_percent": Decimal("15.91"),
            "hsn_code": "3004",
            "gst_rate": Decimal("12.00"),
        },
        {
            "name": "Demo WHO Formula Oral Rehydration Salts (ORS)",
            "slug": "demo-ors-sachet-21g",
            "sku": "DEMO-ORS-21G",
            "generic_name": "Oral Rehydration Salts (WHO Formula)",
            "composition": "Sodium Chloride IP 2.6g, Potassium Chloride IP 1.5g, Sodium Citrate IP 2.9g, Anhydrous Dextrose IP 13.5g",
            "category_slug": "demo-first-aid",
            "brand_slug": "demo-sanjeevani",
            "manufacturer": "Sanjeevani Remedies India",
            "pack_size": "21.8g Sachet",
            "dosage_form": "POWDER",
            "strength": "21.8 g",
            "storage_temperature": "room_temperature",
            "is_cold_chain": False,
            "requires_prescription": False,
            "schedule_classification": "OTC",
            "is_restricted": False,
            "mrp": Decimal("24.00"),
            "selling_price": Decimal("21.50"),
            "discount_percent": Decimal("10.42"),
            "hsn_code": "3004",
            "gst_rate": Decimal("5.00"),
        },
        {
            "name": "Demo Insulin Glargine 100 IU/ml Cartridge",
            "slug": "demo-insulin-glargine-100iu",
            "sku": "DEMO-INS-100",
            "generic_name": "Insulin Glargine (rDNA origin)",
            "composition": "Each ml contains 100 Units Insulin Glargine recombinant DNA origin",
            "category_slug": "demo-diabetic",
            "brand_slug": "demo-biozen",
            "manufacturer": "BioZen Therapeutics Ltd",
            "pack_size": "3 ml Cartridge",
            "dosage_form": "INJECTION",
            "strength": "100 IU/ml",
            "storage_temperature": "refrigerated_2_8c",
            "is_cold_chain": True,
            "requires_prescription": True,
            "schedule_classification": "SCHEDULE_G",
            "is_restricted": False,
            "mrp": Decimal("680.00"),
            "selling_price": Decimal("595.00"),
            "discount_percent": Decimal("12.50"),
            "hsn_code": "3004",
            "gst_rate": Decimal("12.00"),
        },
        {
            "name": "Demo Restricted Formulation (Schedule X Demo)",
            "slug": "demo-restricted-schedule-x",
            "sku": "DEMO-SCH-X-DEMO",
            "generic_name": "Controlled Substance Demo",
            "composition": "Fictional restricted substance for regulatory compliance validation",
            "category_slug": "demo-analgesics",
            "brand_slug": "demo-apex",
            "manufacturer": "Apex MediCorp India Ltd",
            "pack_size": "10 Tablets",
            "dosage_form": "TABLET",
            "strength": "10 mg",
            "storage_temperature": "room_temperature",
            "is_cold_chain": False,
            "requires_prescription": True,
            "schedule_classification": "SCHEDULE_X",
            "is_restricted": True,  # Strictly NOT purchasable online!
            "mrp": Decimal("100.00"),
            "selling_price": Decimal("100.00"),
            "discount_percent": Decimal("0.00"),
            "hsn_code": "3004",
            "gst_rate": Decimal("12.00"),
        },
    ]

    today = date.today()
    for item in products_seed:
        existing_prod = session.execute(select(Product).where(Product.slug == item["slug"])).scalar_one_or_none()
        if not existing_prod:
            product = Product(
                name=item["name"],
                slug=item["slug"],
                sku=item["sku"],
                generic_name=item["generic_name"],
                composition=item["composition"],
                category_id=categories_map[item["category_slug"]].id,
                brand_id=brands_map[item["brand_slug"]].id,
                manufacturer=item["manufacturer"],
                pack_size=item["pack_size"],
                dosage_form=item["dosage_form"],
                strength=item["strength"],
                storage_temperature=item["storage_temperature"],
                is_cold_chain=item["is_cold_chain"],
                requires_prescription=item["requires_prescription"],
                schedule_classification=item["schedule_classification"],
                is_restricted=item["is_restricted"],
                mrp=item["mrp"],
                selling_price=item["selling_price"],
                discount_percent=item["discount_percent"],
                hsn_code=item["hsn_code"],
                gst_rate=item["gst_rate"],
                is_active=True,
            )
            session.add(product)
            session.flush()
            stats["products"] += 1

            # Add primary product image placeholder
            img = ProductImage(
                product_id=product.id,
                image_url=f"/images/products/{item['slug']}.jpg",
                alt_text=item["name"],
                is_primary=True,
                sort_order=0,
            )
            session.add(img)

            # Add sample batches and inventory summary (except restricted products)
            if not item["is_restricted"]:
                batch1 = InventoryBatch(
                    product_id=product.id,
                    batch_number=f"DEMO-{item['sku'][:6]}-26A",
                    manufacturing_date=today - timedelta(days=90),
                    expiry_date=today + timedelta(days=540),
                    received_quantity=200,
                    available_quantity=180,
                    reserved_quantity=10,
                    damaged_quantity=0,
                    quarantined_quantity=0,
                    purchase_price=item["selling_price"] * Decimal("0.70"),
                    batch_mrp=item["mrp"],
                    supplier_name="Universal Pharma Wholesalers (Demo)",
                    supplier_invoice_number=f"INV-2026-{stats['products'] * 101}",
                    batch_status="active",
                    storage_location="Shelf-A-04" if not item["is_cold_chain"] else "ColdStorage-Unit-1",
                )
                session.add(batch1)
                session.flush()
                stats["batches"] += 1

                # Second batch with later expiry for FEFO demonstration
                batch2 = InventoryBatch(
                    product_id=product.id,
                    batch_number=f"DEMO-{item['sku'][:6]}-26B",
                    manufacturing_date=today - timedelta(days=30),
                    expiry_date=today + timedelta(days=720),
                    received_quantity=150,
                    available_quantity=150,
                    reserved_quantity=0,
                    damaged_quantity=0,
                    quarantined_quantity=0,
                    purchase_price=item["selling_price"] * Decimal("0.70"),
                    batch_mrp=item["mrp"],
                    supplier_name="Universal Pharma Wholesalers (Demo)",
                    supplier_invoice_number=f"INV-2026-{stats['products'] * 102}",
                    batch_status="active",
                    storage_location="Shelf-A-05" if not item["is_cold_chain"] else "ColdStorage-Unit-1",
                )
                session.add(batch2)
                session.flush()
                stats["batches"] += 1

                # Initial stock movement audit record
                mv = StockMovement(
                    batch_id=batch1.id,
                    product_id=product.id,
                    movement_type="INWARD_PURCHASE",
                    quantity=200,
                    balance_after=200,
                    reference_type="SUPPLIER_INVOICE",
                    notes="Initial demo seed inward batch receipt",
                )
                session.add(mv)

                # Product-level inventory record
                inv = Inventory(
                    product_id=product.id,
                    total_available_quantity=330,  # 180 + 150
                    total_reserved_quantity=10,
                    total_damaged_quantity=0,
                    total_quarantined_quantity=0,
                    reorder_level=30,
                    reorder_quantity=100,
                    is_in_stock=True,
                )
                session.add(inv)
                stats["inventory"] += 1

    session.commit()
    return stats


def main() -> None:
    """CLI runner to seed database using psycopg2 synchronous engine."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    db_url = settings.SYNC_DATABASE_URL
    if not db_url:
        print("Error: SYNC_DATABASE_URL is not configured.")
        sys.exit(1)

    print(f"Connecting to database: {db_url.split('@')[-1]}")
    sync_engine = create_engine(db_url, echo=False)
    SessionSync = sessionmaker(bind=sync_engine)

    with SessionSync() as session:
        print("Seeding Med24Plus development demonstration records...")
        results = seed_data_sync(session)
        print("Development seed completed successfully:")
        for k, v in results.items():
            print(f"  - {k.capitalize()}: {v} records added")


if __name__ == "__main__":
    main()

