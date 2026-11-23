"""Med24Plus Comprehensive Pharmaceutical & Healthcare Products Seeder.

Seeds standard Indian market pharmaceutical products, prescription medicines (Schedule H/H1),
OTC healthcare products, and surgical devices into the Med24Plus master catalog.

Also creates:
- Manufacturer Brands (GSK, Sun Pharma, Cipla, Abbott, Dr. Reddy's, etc.)
- Sellable inventory allocations
- Active pharmaceutical batches (supporting FEFO allocation)

Safe and idempotent:
- Can be run multiple times safely.
- Updates existing products without data loss.
- Automatically resolves category UUIDs from the seeded taxonomy.

Usage:
    docker compose exec backend python -m app.utils.seed_products
"""

import argparse
import sys
import uuid
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.brand import Brand
from app.models.category import Category
from app.models.inventory import Inventory, InventoryBatch
from app.models.product import Product


# ==============================================================================
# Master Brands Data
# ==============================================================================

MASTER_BRANDS: List[Dict[str, Any]] = [
    {"name": "GlaxoSmithKline Pharmaceuticals Ltd", "slug": "gsk", "manufacturer_name": "GlaxoSmithKline Pharmaceuticals Ltd", "country_of_origin": "India"},
    {"name": "Sun Pharmaceutical Industries Ltd", "slug": "sun-pharma", "manufacturer_name": "Sun Pharmaceutical Industries Ltd", "country_of_origin": "India"},
    {"name": "Cipla Ltd", "slug": "cipla", "manufacturer_name": "Cipla Limited", "country_of_origin": "India"},
    {"name": "Abbott Healthcare Pvt Ltd", "slug": "abbott", "manufacturer_name": "Abbott Healthcare Private Limited", "country_of_origin": "India"},
    {"name": "Dr. Reddy's Laboratories Ltd", "slug": "dr-reddys", "manufacturer_name": "Dr. Reddy's Laboratories Ltd", "country_of_origin": "India"},
    {"name": "Lupin Ltd", "slug": "lupin", "manufacturer_name": "Lupin Limited", "country_of_origin": "India"},
    {"name": "Glenmark Pharmaceuticals Ltd", "slug": "glenmark", "manufacturer_name": "Glenmark Pharmaceuticals Ltd", "country_of_origin": "India"},
    {"name": "Alkem Laboratories Ltd", "slug": "alkem", "manufacturer_name": "Alkem Laboratories Ltd", "country_of_origin": "India"},
    {"name": "Mankind Pharma Ltd", "slug": "mankind", "manufacturer_name": "Mankind Pharma Ltd", "country_of_origin": "India"},
    {"name": "Torrent Pharmaceuticals Ltd", "slug": "torrent-pharma", "manufacturer_name": "Torrent Pharmaceuticals Ltd", "country_of_origin": "India"},
    {"name": "Micro Labs Ltd", "slug": "micro-labs", "manufacturer_name": "Micro Labs Limited", "country_of_origin": "India"},
    {"name": "Dabur India Ltd", "slug": "dabur", "manufacturer_name": "Dabur India Limited", "country_of_origin": "India"},
    {"name": "Reckitt Benckiser India Ltd", "slug": "reckitt", "manufacturer_name": "Reckitt Benckiser (India) Pvt Ltd", "country_of_origin": "India"},
    {"name": "Himalaya Wellness Company", "slug": "himalaya", "manufacturer_name": "The Himalaya Drug Company", "country_of_origin": "India"},
    {"name": "Omron Healthcare India Pvt Ltd", "slug": "omron", "manufacturer_name": "Omron Healthcare India Pvt Ltd", "country_of_origin": "India"},
    {"name": "Procter & Gamble Health Ltd", "slug": "pg-health", "manufacturer_name": "Procter & Gamble Health Limited", "country_of_origin": "India"},
]


# ==============================================================================
# Master Medicines & Healthcare Products Catalog Data
# ==============================================================================

MASTER_PRODUCTS: List[Dict[str, Any]] = [
    # --------------------------------------------------------------------------
    # 1. Anti-Infectives & Antibiotics
    # --------------------------------------------------------------------------
    {
        "name": "Augmentin 625 Duo Tablet",
        "slug": "augmentin-625-duo-tablet",
        "sku": "MED-AUG-625-10T",
        "generic_name": "Amoxycillin and Potassium Clavulanate Tablets IP",
        "composition": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
        "category_slug": "antibacterials",
        "fallback_category_slug": "anti-infectives",
        "brand_slug": "gsk",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "marketer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Augmentin 625 Duo is a broad-spectrum penicillin-type antibiotic used to treat bacterial infections of the lungs, airways, ears, urinary tract, skin, and soft tissues.",
        "pack_size": "strip of 10 tablets",
        "dosage_form": "tablet",
        "strength": "625mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H1",
        "mrp": Decimal("223.50"),
        "selling_price": Decimal("195.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Azithral 500 Tablet",
        "slug": "azithral-500-tablet",
        "sku": "MED-AZI-500-5T",
        "generic_name": "Azithromycin Tablets IP",
        "composition": "Azithromycin (500mg)",
        "category_slug": "antibacterials",
        "fallback_category_slug": "anti-infectives",
        "brand_slug": "cipla",
        "manufacturer": "Alembic Pharmaceuticals Ltd / Cipla",
        "marketer": "Cipla Ltd",
        "description": "Azithral 500 is a macrolide antibiotic used to treat bacterial infections of the respiratory tract, ear, nose, throat, lungs, skin, and eyes.",
        "pack_size": "strip of 5 tablets",
        "dosage_form": "tablet",
        "strength": "500mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H1",
        "mrp": Decimal("132.00"),
        "selling_price": Decimal("115.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Taxim-O 200 Tablet",
        "slug": "taxim-o-200-tablet",
        "sku": "MED-TAX-200-10T",
        "generic_name": "Cefixime Tablets IP",
        "composition": "Cefixime (200mg)",
        "category_slug": "antibacterials",
        "fallback_category_slug": "anti-infectives",
        "brand_slug": "alkem",
        "manufacturer": "Alkem Laboratories Ltd",
        "marketer": "Alkem Laboratories Ltd",
        "description": "Taxim-O 200 is a cephalosporin antibiotic used to treat a wide variety of bacterial infections including typhoid fever, pneumonia, and UTIs.",
        "pack_size": "strip of 10 tablets",
        "dosage_form": "tablet",
        "strength": "200mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H1",
        "mrp": Decimal("180.00"),
        "selling_price": Decimal("155.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Candiforce 200 Capsule",
        "slug": "candiforce-200-capsule",
        "sku": "MED-CAN-200-7C",
        "generic_name": "Itraconazole Capsules IP",
        "composition": "Itraconazole (200mg)",
        "category_slug": "antifungals",
        "fallback_category_slug": "anti-infectives",
        "brand_slug": "mankind",
        "manufacturer": "Mankind Pharma Ltd",
        "marketer": "Mankind Pharma Ltd",
        "description": "Candiforce 200 contains Itraconazole, an antifungal medication used to treat deep and superficial fungal infections of mouth, throat, vagina, skin, and nails.",
        "pack_size": "strip of 7 capsules",
        "dosage_form": "capsule",
        "strength": "200mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("175.00"),
        "selling_price": Decimal("148.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Zentel 400mg Tablet",
        "slug": "zentel-400mg-tablet",
        "sku": "MED-ZEN-400-1T",
        "generic_name": "Albendazole Chewable Tablets IP",
        "composition": "Albendazole (400mg)",
        "category_slug": "antiparasitics",
        "fallback_category_slug": "anti-infectives",
        "brand_slug": "gsk",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "marketer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Zentel 400 is an anthelmintic medication effective against pinworm, roundworm, hookworm, whipworm, and tapeworm infestations.",
        "pack_size": "strip of 1 tablet",
        "dosage_form": "tablet",
        "strength": "400mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("12.50"),
        "selling_price": Decimal("10.50"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 2. Cardiovascular & Heart Health
    # --------------------------------------------------------------------------
    {
        "name": "Telma 40 Tablet",
        "slug": "telma-40-tablet",
        "sku": "MED-TEL-040-30T",
        "generic_name": "Telmisartan Tablets IP",
        "composition": "Telmisartan (40mg)",
        "category_slug": "antihypertensives",
        "fallback_category_slug": "cardiovascular",
        "brand_slug": "glenmark",
        "manufacturer": "Glenmark Pharmaceuticals Ltd",
        "marketer": "Glenmark Pharmaceuticals Ltd",
        "description": "Telma 40 contains Telmisartan, an angiotensin receptor blocker (ARB) widely prescribed for managing essential hypertension and reducing cardiovascular risks.",
        "pack_size": "strip of 30 tablets",
        "dosage_form": "tablet",
        "strength": "40mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("245.00"),
        "selling_price": Decimal("210.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Amlokind 5 Tablet",
        "slug": "amlokind-5-tablet",
        "sku": "MED-AML-005-15T",
        "generic_name": "Amlodipine Tablets IP",
        "composition": "Amlodipine Besilate (5mg)",
        "category_slug": "antihypertensives",
        "fallback_category_slug": "cardiovascular",
        "brand_slug": "mankind",
        "manufacturer": "Mankind Pharma Ltd",
        "marketer": "Mankind Pharma Ltd",
        "description": "Amlokind 5 is a calcium channel blocker used in the medical treatment of high blood pressure (hypertension) and angina pectoris.",
        "pack_size": "strip of 15 tablets",
        "dosage_form": "tablet",
        "strength": "5mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("38.00"),
        "selling_price": Decimal("32.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Atorva 10 Tablet",
        "slug": "atorva-10-tablet",
        "sku": "MED-ATO-010-15T",
        "generic_name": "Atorvastatin Tablets IP",
        "composition": "Atorvastatin (10mg)",
        "category_slug": "cholesterol-statins",
        "fallback_category_slug": "cardiovascular",
        "brand_slug": "zydus",
        "manufacturer": "Zydus Healthcare Ltd",
        "marketer": "Zydus Healthcare Ltd",
        "description": "Atorva 10 belongs to the statin class of lipid-lowering drugs used to lower blood cholesterol and triglycerides and prevent heart attacks.",
        "pack_size": "strip of 15 tablets",
        "dosage_form": "tablet",
        "strength": "10mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("110.00"),
        "selling_price": Decimal("94.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Ecosprin 75 Tablet",
        "slug": "ecosprin-75-tablet",
        "sku": "MED-ECO-075-14T",
        "generic_name": "Aspirin Gastro-resistant Tablets IP",
        "composition": "Aspirin (75mg)",
        "category_slug": "blood-thinners",
        "fallback_category_slug": "cardiovascular",
        "brand_slug": "abbott",
        "manufacturer": "USV Pvt Ltd / Abbott",
        "marketer": "Abbott Healthcare Pvt Ltd",
        "description": "Ecosprin 75 is an antiplatelet medication used to prevent blood clots, reducing the risk of ischemic strokes and heart attacks.",
        "pack_size": "strip of 14 tablets",
        "dosage_form": "tablet",
        "strength": "75mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("6.50"),
        "selling_price": Decimal("5.50"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 3. Diabetes Care & Endocrine
    # --------------------------------------------------------------------------
    {
        "name": "Glycomet-GP 2 Tablet PR",
        "slug": "glycomet-gp-2-tablet-pr",
        "sku": "MED-GLY-002-15T",
        "generic_name": "Glimepiride and Metformin Hydrochloride Prolonged Release Tablets",
        "composition": "Glimepiride (2mg) + Metformin (500mg)",
        "category_slug": "oral-hypoglycemics",
        "fallback_category_slug": "diabetes-care",
        "brand_slug": "abbott",
        "manufacturer": "USV Pvt Ltd / Abbott",
        "marketer": "Abbott Healthcare Pvt Ltd",
        "description": "Glycomet-GP 2 is a combination antidiabetic medication that helps control blood sugar levels in adults with Type 2 Diabetes Mellitus.",
        "pack_size": "strip of 15 tablets",
        "dosage_form": "tablet",
        "strength": "2mg/500mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("158.00"),
        "selling_price": Decimal("138.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Thyronorm 50mcg Tablet",
        "slug": "thyronorm-50mcg-tablet",
        "sku": "MED-THY-050-120T",
        "generic_name": "Levothyroxine Sodium Tablets IP",
        "composition": "Thyroxine Sodium (50mcg)",
        "category_slug": "thyroid-care",
        "fallback_category_slug": "diabetes-care",
        "brand_slug": "abbott",
        "manufacturer": "Abbott Healthcare Pvt Ltd",
        "marketer": "Abbott Healthcare Pvt Ltd",
        "description": "Thyronorm 50mcg is a synthetic thyroid hormone replacement medication prescribed for the management of hypothyroidism.",
        "pack_size": "bottle of 120 tablets",
        "dosage_form": "tablet",
        "strength": "50mcg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("195.00"),
        "selling_price": Decimal("170.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Accu-Chek Active 50 Test Strips",
        "slug": "accu-chek-active-50-test-strips",
        "sku": "DEV-ACC-ACT-50S",
        "generic_name": "Blood Glucose Test Strips",
        "composition": "Glucose dehydrogenase test strips for self-testing",
        "category_slug": "glucose-monitoring",
        "fallback_category_slug": "diabetes-care",
        "brand_slug": "abbott",
        "manufacturer": "Roche Diabetes Care / Abbott",
        "marketer": "Roche Diabetes Care India",
        "description": "Accu-Chek Active test strips provide accurate quantitative blood glucose testing for people with Type 1 and Type 2 diabetes.",
        "pack_size": "box of 50 strips",
        "dosage_form": "device",
        "strength": "50 strips",
        "route_of_administration": "diagnostic",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("1049.00"),
        "selling_price": Decimal("899.00"),
        "hsn_code": "9027",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 4. Pain Relief & Analgesics
    # --------------------------------------------------------------------------
    {
        "name": "Dolo 650 Tablet",
        "slug": "dolo-650-tablet",
        "sku": "MED-DOL-650-15T",
        "generic_name": "Paracetamol Tablets IP 650mg",
        "composition": "Paracetamol (650mg)",
        "category_slug": "antipyretics",
        "fallback_category_slug": "pain-relief",
        "brand_slug": "micro-labs",
        "manufacturer": "Micro Labs Limited",
        "marketer": "Micro Labs Limited",
        "description": "Dolo 650 is a clinically trusted analgesic and antipyretic medicine formulated to relieve moderate pain and high fever.",
        "pack_size": "strip of 15 tablets",
        "dosage_form": "tablet",
        "strength": "650mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("34.00"),
        "selling_price": Decimal("30.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Combiflam Tablet",
        "slug": "combiflam-tablet",
        "sku": "MED-COM-FLM-20T",
        "generic_name": "Ibuprofen and Paracetamol Tablets IP",
        "composition": "Ibuprofen (400mg) + Paracetamol (325mg)",
        "category_slug": "nsaids",
        "fallback_category_slug": "pain-relief",
        "brand_slug": "abbott",
        "manufacturer": "Sanofi India Ltd / Abbott",
        "marketer": "Sanofi India Ltd",
        "description": "Combiflam contains Ibuprofen and Paracetamol, providing synergistic relief from dental pain, muscular aches, headaches, and menstrual pain.",
        "pack_size": "strip of 20 tablets",
        "dosage_form": "tablet",
        "strength": "400mg/325mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("46.00"),
        "selling_price": Decimal("39.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Zerodol-SP Tablet",
        "slug": "zerodol-sp-tablet",
        "sku": "MED-ZER-SP-10T",
        "generic_name": "Aceclofenac, Paracetamol and Serratiopeptidase Tablets",
        "composition": "Aceclofenac (100mg) + Paracetamol (325mg) + Serratiopeptidase (15mg)",
        "category_slug": "nsaids",
        "fallback_category_slug": "pain-relief",
        "brand_slug": "cipla",
        "manufacturer": "Ipca Laboratories Ltd / Cipla",
        "marketer": "Ipca Laboratories Ltd",
        "description": "Zerodol-SP is a triple-action anti-inflammatory pain reliever used for post-operative trauma, bone fractures, sprains, and inflammatory conditions.",
        "pack_size": "strip of 10 tablets",
        "dosage_form": "tablet",
        "strength": "100mg/325mg/15mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("120.00"),
        "selling_price": Decimal("104.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Volini Pain Relief Spray",
        "slug": "volini-pain-relief-spray",
        "sku": "OTC-VOL-SPR-100G",
        "generic_name": "Diclofenac Diethylamine Topical Aerosol Spray",
        "composition": "Diclofenac (1.16% w/w) + Methyl Salicylate + Menthol + Virgin Linseed Oil",
        "category_slug": "pain-balms-sprays",
        "fallback_category_slug": "pain-relief",
        "brand_slug": "sun-pharma",
        "manufacturer": "Sun Pharmaceutical Industries Ltd",
        "marketer": "Sun Pharmaceutical Industries Ltd",
        "description": "Volini Spray provides fast micro-particle penetration for quick relief from acute muscle pain, backaches, joint stiffness, and sports injuries.",
        "pack_size": "bottle of 100g",
        "dosage_form": "spray",
        "strength": "100g",
        "route_of_administration": "topical",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("310.00"),
        "selling_price": Decimal("265.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 5. Gastrointestinal & Digestive Health
    # --------------------------------------------------------------------------
    {
        "name": "Pan-D Capsule",
        "slug": "pan-d-capsule",
        "sku": "MED-PAN-D-15C",
        "generic_name": "Pantoprazole Gastro-resistant and Domperidone Prolonged-release Capsules IP",
        "composition": "Pantoprazole (40mg) + Domperidone (30mg SR)",
        "category_slug": "antacids-reflux",
        "fallback_category_slug": "gastrointestinal",
        "brand_slug": "alkem",
        "manufacturer": "Alkem Laboratories Ltd",
        "marketer": "Alkem Laboratories Ltd",
        "description": "Pan-D is formulated to relieve gastroesophageal reflux disease (GERD), persistent acidity, heartburn, and nausea associated with acid reflux.",
        "pack_size": "strip of 15 capsules",
        "dosage_form": "capsule",
        "strength": "40mg/30mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("215.00"),
        "selling_price": Decimal("185.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Omez 20 Capsule",
        "slug": "omez-20-capsule",
        "sku": "MED-OME-020-20C",
        "generic_name": "Omeprazole Capsules IP",
        "composition": "Omeprazole (20mg)",
        "category_slug": "antacids-reflux",
        "fallback_category_slug": "gastrointestinal",
        "brand_slug": "dr-reddys",
        "manufacturer": "Dr. Reddy's Laboratories Ltd",
        "marketer": "Dr. Reddy's Laboratories Ltd",
        "description": "Omez 20 is an established proton pump inhibitor (PPI) that decreases stomach acid secretion, treating stomach ulcers and acid regurgitation.",
        "pack_size": "strip of 20 capsules",
        "dosage_form": "capsule",
        "strength": "20mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("110.00"),
        "selling_price": Decimal("92.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Digene Antacid Gel Mint Flavour",
        "slug": "digene-antacid-gel-mint",
        "sku": "OTC-DIG-GEL-200M",
        "generic_name": "Dried Aluminium Hydroxide, Magnesium Hydroxide and Simethicone Oral Suspension",
        "composition": "Magnesium Hydroxide + Aluminium Hydroxide + Simethicone",
        "category_slug": "antacids-reflux",
        "fallback_category_slug": "gastrointestinal",
        "brand_slug": "abbott",
        "manufacturer": "Abbott India Ltd",
        "marketer": "Abbott India Ltd",
        "description": "Digene Gel offers scientifically proven rapid acid neutralization with soothing relief from gas, bloating, and stomach discomfort.",
        "pack_size": "bottle of 200ml",
        "dosage_form": "syrup",
        "strength": "200ml",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("150.00"),
        "selling_price": Decimal("132.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Himalaya Liv.52 DS Tablet",
        "slug": "himalaya-liv-52-ds-tablet",
        "sku": "AYU-LIV-52DS-60T",
        "generic_name": "Hepatoprotective Ayurvedic Tablet Formulation",
        "composition": "Himsra (Capparis spinosa) + Kasani (Cichorium intybus) + Mandur bhasma",
        "category_slug": "liver-care",
        "fallback_category_slug": "gastrointestinal",
        "brand_slug": "himalaya",
        "manufacturer": "The Himalaya Drug Company",
        "marketer": "Himalaya Wellness Company",
        "description": "Liv.52 DS double-strength formula restores metabolic efficiency of the liver, protects hepatic parenchyma against toxins, and improves appetite.",
        "pack_size": "bottle of 60 tablets",
        "dosage_form": "tablet",
        "strength": "double strength",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("230.00"),
        "selling_price": Decimal("205.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 6. Respiratory & Allergy Care
    # --------------------------------------------------------------------------
    {
        "name": "Asthalin 100mcg Inhaler",
        "slug": "asthalin-100mcg-inhaler",
        "sku": "MED-AST-100-200D",
        "generic_name": "Salbutamol Inhalation Aerosol IP",
        "composition": "Salbutamol (100mcg per actuation)",
        "category_slug": "inhalers-respules",
        "fallback_category_slug": "respiratory-allergy",
        "brand_slug": "cipla",
        "manufacturer": "Cipla Ltd",
        "marketer": "Cipla Ltd",
        "description": "Asthalin Inhaler is a short-acting beta-2 agonist bronchodilator used for prompt relief of bronchospasm in asthma and chronic obstructive pulmonary disease (COPD).",
        "pack_size": "canister of 200 metered doses",
        "dosage_form": "inhaler",
        "strength": "100mcg",
        "route_of_administration": "inhalation",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("172.00"),
        "selling_price": Decimal("150.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Montair-LC Tablet",
        "slug": "montair-lc-tablet",
        "sku": "MED-MON-LC-15T",
        "generic_name": "Montelukast Sodium and Levocetirizine Hydrochloride Tablets IP",
        "composition": "Montelukast (10mg) + Levocetirizine (5mg)",
        "category_slug": "antihistamines",
        "fallback_category_slug": "respiratory-allergy",
        "brand_slug": "cipla",
        "manufacturer": "Cipla Ltd",
        "marketer": "Cipla Ltd",
        "description": "Montair-LC effectively blocks histamine and leukotrienes to prevent and relieve allergic rhinitis, perennial allergies, and asthma symptoms.",
        "pack_size": "strip of 15 tablets",
        "dosage_form": "tablet",
        "strength": "10mg/5mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": True,
        "schedule_classification": "Schedule H",
        "mrp": Decimal("245.00"),
        "selling_price": Decimal("212.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Otrivin Oxy Fast Relief Nasal Spray",
        "slug": "otrivin-oxy-fast-relief-nasal-spray",
        "sku": "OTC-OTR-OXY-10ML",
        "generic_name": "Oxymetazoline Hydrochloride Nasal Solution USP",
        "composition": "Oxymetazoline Hydrochloride (0.05% w/v)",
        "category_slug": "nasal-decongestants",
        "fallback_category_slug": "respiratory-allergy",
        "brand_slug": "gsk",
        "manufacturer": "GlaxoSmithKline Asia Pvt Ltd",
        "marketer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Otrivin Oxy provides immediate 25-second fast action to open blocked sinuses and relieve congestion due to common cold or allergies for up to 12 hours.",
        "pack_size": "bottle of 10ml",
        "dosage_form": "spray",
        "strength": "0.05% w/v",
        "route_of_administration": "nasal",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("115.00"),
        "selling_price": Decimal("99.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 7. Vitamins, Minerals & Supplements
    # --------------------------------------------------------------------------
    {
        "name": "Becosules Z Capsule",
        "slug": "becosules-z-capsule",
        "sku": "NUT-BEC-Z-20C",
        "generic_name": "Vitamin B Complex Forte with Vitamin C and Zinc Capsules",
        "composition": "B-Complex + Vitamin C (50mg) + Zinc Sulphate (41.4mg)",
        "category_slug": "multivitamins",
        "fallback_category_slug": "vitamins-supplements",
        "brand_slug": "gsk",
        "manufacturer": "Pfizer India / GSK",
        "marketer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Becosules Z is India's most trusted daily B-complex and Zinc supplement formulated to treat mouth ulcers, restore tissue vitality, and boost natural immunity.",
        "pack_size": "strip of 20 capsules",
        "dosage_form": "capsule",
        "strength": "therapeutic",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("52.00"),
        "selling_price": Decimal("46.00"),
        "hsn_code": "2106",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Shelcal 500 Tablet",
        "slug": "shelcal-500-tablet",
        "sku": "NUT-SHE-500-15T",
        "generic_name": "Calcium 500mg and Vitamin D3 250 IU Tablets",
        "composition": "Calcium Carbonate (1250mg eq to elemental Calcium 500mg) + Vitamin D3 (250 IU)",
        "category_slug": "calcium-d3",
        "fallback_category_slug": "vitamins-supplements",
        "brand_slug": "torrent-pharma",
        "manufacturer": "Torrent Pharmaceuticals Ltd",
        "marketer": "Torrent Pharmaceuticals Ltd",
        "description": "Shelcal 500 provides high-absorption elemental calcium and cholecalciferol to strengthen bone mineral density and prevent osteoporosis and osteomalacia.",
        "pack_size": "strip of 15 tablets",
        "dosage_form": "tablet",
        "strength": "500mg/250IU",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("138.00"),
        "selling_price": Decimal("118.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Limcee 500mg Chewable Tablet Orange",
        "slug": "limcee-500mg-chewable-tablet",
        "sku": "NUT-LIM-500-15T",
        "generic_name": "Ascorbic Acid Chewable Tablets IP",
        "composition": "Ascorbic Acid (100mg) + Sodium Ascorbate (450mg eq to Vitamin C 500mg)",
        "category_slug": "vitamin-c-immunity",
        "fallback_category_slug": "vitamins-supplements",
        "brand_slug": "abbott",
        "manufacturer": "Abbott Healthcare Pvt Ltd",
        "marketer": "Abbott Healthcare Pvt Ltd",
        "description": "Limcee 500 is a delicious orange chewable antioxidant vitamin C tablet that enhances collagen synthesis, wound repair, and seasonal infection resistance.",
        "pack_size": "strip of 15 chewable tablets",
        "dosage_form": "tablet",
        "strength": "500mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("30.00"),
        "selling_price": Decimal("26.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
    {
        "name": "Seven Seas Original Cod Liver Oil Capsules",
        "slug": "seven-seas-cod-liver-oil-capsules",
        "sku": "NUT-7SEAS-100C",
        "generic_name": "Cod Liver Oil Capsules USP with Vitamin A and D",
        "composition": "Cod Liver Oil (300mg) containing Omega-3 EPA and DHA",
        "category_slug": "omega-3-fish-oil",
        "fallback_category_slug": "vitamins-supplements",
        "brand_slug": "pg-health",
        "manufacturer": "Procter & Gamble Health Ltd",
        "marketer": "Procter & Gamble Health Ltd",
        "description": "Seven Seas Cod Liver Oil delivers rich ocean-sourced Omega-3 fatty acids plus Vitamins A and D to support flexible joints, sharp eyesight, and cardiovascular health.",
        "pack_size": "bottle of 100 capsules",
        "dosage_form": "capsule",
        "strength": "300mg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("365.00"),
        "selling_price": Decimal("315.00"),
        "hsn_code": "2106",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 8. First Aid & Antiseptics
    # --------------------------------------------------------------------------
    {
        "name": "Dettol Antiseptic Liquid 550ml",
        "slug": "dettol-antiseptic-liquid-550ml",
        "sku": "OTC-DET-LIQ-550M",
        "generic_name": "Chloroxylenol Antiseptic Disinfectant Liquid",
        "composition": "Chloroxylenol (4.8% w/v) + Terpineol + Absolute Alcohol",
        "category_slug": "antiseptic-liquids",
        "fallback_category_slug": "first-aid-wound-care",
        "brand_slug": "reckitt",
        "manufacturer": "Reckitt Benckiser (India) Pvt Ltd",
        "marketer": "Reckitt Benckiser (India) Pvt Ltd",
        "description": "Dettol Antiseptic Liquid provides proven hospital-grade protection against 100 illness-causing germs for cuts, scratches, insect bites, and personal hygiene.",
        "pack_size": "bottle of 550ml",
        "dosage_form": "liquid",
        "strength": "4.8% w/v",
        "route_of_administration": "topical",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("225.00"),
        "selling_price": Decimal("199.00"),
        "hsn_code": "3808",
        "gst_rate": Decimal("18.00"),
    },
    {
        "name": "Betadine 10% Solution 100ml",
        "slug": "betadine-10-solution-100ml",
        "sku": "MED-BET-SOL-100M",
        "generic_name": "Povidone Iodine Solution IP 10% w/v",
        "composition": "Povidone-Iodine (10% w/v eq to Available Iodine 1%)",
        "category_slug": "antiseptic-liquids",
        "fallback_category_slug": "first-aid-wound-care",
        "brand_slug": "gsk",
        "manufacturer": "Win-Medicare Pvt Ltd / GSK",
        "marketer": "Win-Medicare Pvt Ltd",
        "description": "Betadine 10% Solution is a gold standard microbicidal antiseptic that rapidly destroys bacteria, spores, fungi, and viruses in minor burns, lacerations, and surgical wounds.",
        "pack_size": "bottle of 100ml",
        "dosage_form": "liquid",
        "strength": "10% w/v",
        "route_of_administration": "topical",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("145.00"),
        "selling_price": Decimal("126.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 9. Medical Devices & Diagnostics
    # --------------------------------------------------------------------------
    {
        "name": "Omron HEM-7120 Automatic Digital Blood Pressure Monitor",
        "slug": "omron-hem-7120-bp-monitor",
        "sku": "DEV-OMR-7120-1U",
        "generic_name": "Digital Upper Arm Sphygmomanometer",
        "composition": "Intellisense Technology Upper Arm BP Monitor with Cuff and Batteries",
        "category_slug": "bp-monitors",
        "fallback_category_slug": "medical-devices",
        "brand_slug": "omron",
        "manufacturer": "Omron Healthcare Co. Ltd",
        "marketer": "Omron Healthcare India Pvt Ltd",
        "description": "Omron HEM-7120 features clinically validated oscillometric measurement with hypertension indicator and irregular heartbeat detection for precise home BP monitoring.",
        "pack_size": "1 unit with cuff",
        "dosage_form": "device",
        "strength": "medical grade",
        "route_of_administration": "diagnostic",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("2440.00"),
        "selling_price": Decimal("1999.00"),
        "hsn_code": "9018",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 10. Ayurveda & Herbal Wellness
    # --------------------------------------------------------------------------
    {
        "name": "Dabur Chyawanprash Awaleha 2X Immunity 1kg",
        "slug": "dabur-chyawanprash-1kg",
        "sku": "AYU-DAB-CHY-1KG",
        "generic_name": "Classical Ayurvedic Herbal Rasayana Jam",
        "composition": "Amla + Ashwagandha + Pippali + Shatavari and 40+ Ayurvedic herbs",
        "category_slug": "chyawanprash-immunity",
        "fallback_category_slug": "ayurveda-herbal",
        "brand_slug": "dabur",
        "manufacturer": "Dabur India Limited",
        "marketer": "Dabur India Limited",
        "description": "Dabur Chyawanprash is a time-tested Ayurvedic formulation with 2X immunity clinically shown to protect against seasonal illnesses, coughs, and colds.",
        "pack_size": "jar of 1kg",
        "dosage_form": "syrup",
        "strength": "1kg",
        "route_of_administration": "oral",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("440.00"),
        "selling_price": Decimal("385.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },

    # --------------------------------------------------------------------------
    # 11. Personal Care & Hygiene
    # --------------------------------------------------------------------------
    {
        "name": "Sensodyne Repair and Protect Deep Repair Toothpaste",
        "slug": "sensodyne-repair-protect-toothpaste",
        "sku": "OTC-SEN-REP-100G",
        "generic_name": "Fluoride Toothpaste with Novamin for Dentin Hypersensitivity",
        "composition": "Calcium Sodium Phosphosilicate (Novamin 5% w/w) + Sodium Monofluorophosphate",
        "category_slug": "oral-care",
        "fallback_category_slug": "personal-care",
        "brand_slug": "gsk",
        "manufacturer": "Haleon India / GSK",
        "marketer": "GlaxoSmithKline Consumer Healthcare",
        "description": "Sensodyne Repair and Protect creates a reparative mineral layer over vulnerable sensitive areas of teeth to guard against sharp sensitivity jolts.",
        "pack_size": "tube of 100g",
        "dosage_form": "paste",
        "strength": "100g",
        "route_of_administration": "topical",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("245.00"),
        "selling_price": Decimal("215.00"),
        "hsn_code": "3306",
        "gst_rate": Decimal("18.00"),
    },

    # --------------------------------------------------------------------------
    # 12. Ophthalmology & Eye Care
    # --------------------------------------------------------------------------
    {
        "name": "Refresh Tears Lubricant Eye Drops 10ml",
        "slug": "refresh-tears-lubricant-eye-drops",
        "sku": "MED-REF-TEA-10ML",
        "generic_name": "Carboxymethylcellulose Sodium Eye Drops IP 0.5% w/v",
        "composition": "Carboxymethylcellulose Sodium (0.5% w/v) + Purite (preservative)",
        "category_slug": "eye-drops",
        "fallback_category_slug": "ophthalmology-ent",
        "brand_slug": "abbott",
        "manufacturer": "Allergan India Pvt Ltd / AbbVie",
        "marketer": "Abbott Healthcare Pvt Ltd",
        "description": "Refresh Tears restores natural moisture to dry, burning, irritated eyes caused by prolonged screen exposure, air conditioning, and wind.",
        "pack_size": "bottle of 10ml",
        "dosage_form": "drops",
        "strength": "0.5% w/v",
        "route_of_administration": "ophthalmic",
        "storage_temperature": "room_temperature",
        "is_cold_chain": False,
        "requires_prescription": False,
        "schedule_classification": "OTC",
        "mrp": Decimal("165.00"),
        "selling_price": Decimal("142.00"),
        "hsn_code": "3004",
        "gst_rate": Decimal("12.00"),
    },
]


def seed_products() -> None:
    """Synchronously seed standard pharmaceutical brands, products, and inventory."""
    db_url = settings.SYNC_DATABASE_URL
    if not db_url:
        db_url = settings.DATABASE_URL.replace("+asyncpg", "") if settings.DATABASE_URL else ""

    if not db_url:
        print("ERROR: DATABASE_URL is not configured in settings.", file=sys.stderr)
        sys.exit(1)

    print("Connecting to database...")
    engine = create_engine(db_url, echo=False)
    SessionLocal = sessionmaker(bind=engine)
    session: Session = SessionLocal()

    created_brands = 0
    updated_brands = 0
    created_products = 0
    updated_products = 0
    created_batches = 0

    try:
        # Step 1: Ensure Brands
        print("\nEnsuring manufacturer brands exist...")
        brands_map: Dict[str, Brand] = {}
        for b_data in MASTER_BRANDS:
            brand = session.execute(
                select(Brand).where(Brand.slug == b_data["slug"])
            ).scalars().first()
            if not brand:
                brand = Brand(
                    name=b_data["name"],
                    slug=b_data["slug"],
                    manufacturer_name=b_data["manufacturer_name"],
                    country_of_origin=b_data["country_of_origin"],
                    is_active=True,
                    is_deleted=False,
                )
                session.add(brand)
                session.flush()
                created_brands += 1
            else:
                brand.is_deleted = False
                brand.is_active = True
                session.flush()
                updated_brands += 1
            brands_map[b_data["slug"]] = brand

        print(f"Brands ready: {created_brands} created, {updated_brands} updated.")

        # Step 2: Ensure Categories Cache
        all_categories = session.execute(
            select(Category).where(Category.is_deleted == False)  # noqa: E712
        ).scalars().all()
        category_by_slug = {c.slug: c for c in all_categories}

        # Step 3: Seed Products, Inventory & Batches
        print(f"\nProcessing {len(MASTER_PRODUCTS)} standard medicines and healthcare formulations...\n")
        today = date.today()

        for idx, p_data in enumerate(MASTER_PRODUCTS):
            # Resolve Category (prefer subcategory, fallback to root)
            cat = category_by_slug.get(p_data["category_slug"])
            if not cat:
                cat = category_by_slug.get(p_data["fallback_category_slug"])
            if not cat and all_categories:
                cat = all_categories[0]

            if not cat:
                print(f"Skipping {p_data['name']}: no category found. Please run seed_categories first.")
                continue

            brand = brands_map.get(p_data["brand_slug"])
            if not brand:
                brand = list(brands_map.values())[0]

            # Calculate discount
            mrp = p_data["mrp"]
            sp = p_data["selling_price"]
            disc = Decimal("0.00")
            if mrp > 0 and sp < mrp:
                disc = round(((mrp - sp) / mrp) * Decimal("100"), 2)

            product = session.execute(
                select(Product).where(Product.slug == p_data["slug"])
            ).scalars().first()

            if not product:
                product = Product(
                    name=p_data["name"],
                    slug=p_data["slug"],
                    sku=p_data["sku"],
                    generic_name=p_data["generic_name"],
                    composition=p_data.get("composition"),
                    category_id=cat.id,
                    brand_id=brand.id,
                    manufacturer=p_data["manufacturer"],
                    marketer=p_data.get("marketer"),
                    description=p_data.get("description"),
                    pack_size=p_data["pack_size"],
                    dosage_form=p_data["dosage_form"],
                    strength=p_data.get("strength"),
                    route_of_administration=p_data.get("route_of_administration"),
                    storage_temperature=p_data.get("storage_temperature", "room_temperature"),
                    is_cold_chain=p_data.get("is_cold_chain", False),
                    requires_prescription=p_data["requires_prescription"],
                    schedule_classification=p_data["schedule_classification"],
                    mrp=mrp,
                    selling_price=sp,
                    discount_percent=disc,
                    hsn_code=p_data["hsn_code"],
                    gst_rate=p_data["gst_rate"],
                    is_active=True,
                    is_deleted=False,
                )
                session.add(product)
                session.flush()
                created_products += 1
                status_icon = "[NEW PRODUCT]"
            else:
                product.name = p_data["name"]
                product.generic_name = p_data["generic_name"]
                product.composition = p_data.get("composition")
                product.category_id = cat.id
                product.brand_id = brand.id
                product.mrp = mrp
                product.selling_price = sp
                product.discount_percent = disc
                product.is_active = True
                product.is_deleted = False
                session.flush()
                updated_products += 1
                status_icon = "[UPDATED PRODUCT]"

            print(f"{status_icon} {product.name} (SKU: {product.sku}) | Category: /{cat.slug}")

            # Step 4: Ensure Inventory & Batches
            inv = session.execute(
                select(Inventory).where(Inventory.product_id == product.id)
            ).scalars().first()

            batch_number = f"BN{idx+1:03d}-2026"
            batch_exists = session.execute(
                select(InventoryBatch).where(
                    InventoryBatch.product_id == product.id,
                    InventoryBatch.batch_number == batch_number,
                )
            ).scalars().first()

            # For the first 2 products, make batch expire in 60 days (so near-expiry alerts trigger dynamically!)
            # For the rest, set a comfortable 2-year expiry date (2028)
            if idx < 2:
                expiry_dt = today + timedelta(days=55)
            else:
                expiry_dt = today + timedelta(days=730)

            mfg_dt = today - timedelta(days=90)
            initial_stock = 150

            if not batch_exists:
                batch = InventoryBatch(
                    product_id=product.id,
                    batch_number=batch_number,
                    manufacturing_date=mfg_dt,
                    expiry_date=expiry_dt,
                    received_quantity=initial_stock,
                    available_quantity=initial_stock,
                    reserved_quantity=0,
                    damaged_quantity=0,
                    quarantined_quantity=0,
                    purchase_price=round(sp * Decimal("0.70"), 2),
                    batch_mrp=mrp,
                    supplier_name="Central Pharma Distributors India",
                    supplier_invoice_number=f"INV-CPD-{202600 + idx}",
                    batch_status="active",
                )
                session.add(batch)
                session.flush()
                created_batches += 1

            if not inv:
                inv = Inventory(
                    product_id=product.id,
                    total_available_quantity=initial_stock,
                    total_reserved_quantity=0,
                    total_damaged_quantity=0,
                    total_quarantined_quantity=0,
                    reorder_level=25,
                    reorder_quantity=100,
                    is_in_stock=True,
                )
                session.add(inv)
                session.flush()
            else:
                inv.total_available_quantity = initial_stock
                inv.is_in_stock = True
                session.flush()

        session.commit()
        print("\n" + "=" * 65)
        print(" PRODUCT & MEDICINE SEEDING COMPLETED SUCCESSFULLY")
        print("=" * 65)
        print(f"Products Added         : {created_products}")
        print(f"Products Updated       : {updated_products}")
        print(f"Inventory Batches Added: {created_batches}")
        print(f"Total Master Products  : {created_products + updated_products}")
        print("=" * 65 + "\n")

    except Exception as e:
        session.rollback()
        print(f"\nERROR during product seeding: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(
        description="Med24Plus Master Medicine & Product Catalog Seeder"
    )
    args = parser.parse_args()
    seed_products()


if __name__ == "__main__":
    main()
