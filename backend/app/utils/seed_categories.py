"""Med24Plus Comprehensive Pharmaceutical & Healthcare Categories Seeder.

Seeds standard medical, therapeutic, and OTC categories with hierarchical
parent-child relationships into the Med24Plus database.

Safe and idempotent:
- Can be run multiple times safely.
- Updates existing categories without data loss.
- Restores soft-deleted categories if matching standard slugs.
- Creates clean root categories and subcategories linked by parent_id.

Usage:
    docker compose exec backend python -m app.utils.seed_categories
    docker compose exec backend python -m app.utils.seed_categories --clean-demo
"""

import argparse
import sys
from typing import Dict, List, Optional, Tuple
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.category import Category


# ==============================================================================
# Master Categories Taxonomy
# (Root Slug, Root Name, Root Description, [(Sub Slug, Sub Name, Sub Description)])
# ==============================================================================

MASTER_CATEGORIES: List[Tuple[str, str, str, List[Tuple[str, str, str]]]] = [
    (
        "anti-infectives",
        "Anti-Infectives & Antibiotics",
        "Prescription antibacterials, antifungals, antivirals, and antiparasitic medications.",
        [
            ("antibacterials", "Antibiotics & Antibacterials", "Broad and narrow spectrum antibiotics for bacterial infections."),
            ("antifungals", "Antifungals", "Oral and topical treatments for fungal and yeast infections."),
            ("antivirals", "Antivirals", "Medications for viral infections including influenza, herpes, and viral hepatitis."),
            ("antiparasitics", "Antiparasitics & Anthelmintics", "Treatments for parasitic infestations, worm infections, and protozoa."),
        ],
    ),
    (
        "cardiovascular",
        "Cardiovascular & Heart Health",
        "Medications for managing blood pressure, cholesterol, heart rhythm, and vascular conditions.",
        [
            ("antihypertensives", "Blood Pressure & Antihypertensives", "ACE inhibitors, ARBs, beta blockers, and calcium channel blockers."),
            ("cholesterol-statins", "Cholesterol & Lipid Reducers", "Statins, fibrates, and lipid management agents."),
            ("blood-thinners", "Blood Thinners & Anticoagulants", "Antiplatelet agents, aspirin formulations, and anticoagulants."),
            ("antiarrhythmics", "Heart Rhythm & Cardiac Support", "Medications for arrhythmias, angina pectoris, and heart failure."),
        ],
    ),
    (
        "diabetes-care",
        "Diabetes Care & Glycemic Control",
        "Insulins, oral hypoglycemics, glucose monitoring devices, and diabetic health supplies.",
        [
            ("oral-hypoglycemics", "Oral Anti-Diabetic Medicines", "Metformin, DPP-4 inhibitors, SGLT2 inhibitors, and sulfonylureas."),
            ("insulins", "Insulins & Injectables", "Rapid, short, intermediate, and long-acting insulin analogues."),
            ("glucose-monitoring", "Glucometers & Test Strips", "Blood glucose monitoring meters, test strips, and lancets."),
            ("thyroid-care", "Thyroid Management", "Levothyroxine and anti-thyroid medications for endocrine balance."),
        ],
    ),
    (
        "pain-relief",
        "Pain Relief & Analgesics",
        "Fever management, anti-inflammatory medications, analgesics, and topical pain relievers.",
        [
            ("antipyretics", "Fever & Antipyretics", "Paracetamol and fever-reducing antipyretic formulations."),
            ("nsaids", "NSAIDs & Anti-Inflammatories", "Ibuprofen, aceclofenac, diclofenac, and non-steroidal pain relievers."),
            ("muscle-relaxants", "Muscle Relaxants", "Formulations for acute muscle spasms, sprains, and back pain."),
            ("pain-balms-sprays", "Pain Balms, Sprays & Gels", "Fast-acting topical analgesics for joint and muscular pain."),
        ],
    ),
    (
        "gastrointestinal",
        "Gastrointestinal & Digestive Health",
        "Treatments for acidity, reflux, indigestion, gut motility, liver care, and bowel health.",
        [
            ("antacids-reflux", "Antacids & Acid Reflux", "Proton pump inhibitors (PPIs), H2 blockers, and antacid syrups."),
            ("laxatives", "Laxatives & Bowel Evacuants", "Stool softeners, bulk-forming fiber, and osmotic laxatives."),
            ("antidiarrheals-ors", "Antidiarrheals & ORS", "Oral rehydration salts (ORS), electrolytes, and antimotility agents."),
            ("probiotics", "Probiotics & Prebiotics", "Beneficial gut flora restoratives for intestinal health and digestion."),
            ("liver-care", "Liver Care & Hepatoprotectives", "Medications and tonics supporting healthy liver function."),
        ],
    ),
    (
        "respiratory-allergy",
        "Respiratory & Allergy Care",
        "Bronchodilators, inhalers, antihistamines, decongestants, and cough syrups.",
        [
            ("inhalers-respules", "Inhalers & Nebulizer Respules", "Metered-dose inhalers, rotacaps, and respules for asthma and COPD."),
            ("antihistamines", "Antihistamines & Anti-Allergics", "Cetirizine, fexofenadine, and levocetirizine for allergic rhinitis."),
            ("cough-syrups", "Cough Syrups & Expectorants", "Formulations for dry cough, productive wet cough, and chest congestion."),
            ("nasal-decongestants", "Nasal Sprays & Decongestants", "Saline and medicated nasal sprays for sinus and nasal blockage."),
        ],
    ),
    (
        "dermatology",
        "Dermatology & Skin Care",
        "Therapeutic dermatological solutions, medicated creams, acne treatments, and sun care.",
        [
            ("acne-treatments", "Acne & Blemish Treatments", "Topical gels, benzoyl peroxide, retinoids, and clindamycin."),
            ("skin-creams-ointments", "Medicated Creams & Ointments", "Antibacterial, anti-itch, and hydrocortisone creams."),
            ("sun-protection", "Sunscreen & Sun Protection", "Dermatologist-recommended broad-spectrum UV protection."),
            ("eczema-psoriasis", "Eczema & Psoriasis Relief", "Emollients, coal tar preparations, and barrier repair creams."),
        ],
    ),
    (
        "vitamins-supplements",
        "Vitamins & Nutritional Supplements",
        "Multivitamins, minerals, immunity boosters, omega fatty acids, and sports nutrition.",
        [
            ("multivitamins", "Daily Multivitamins & Minerals", "Comprehensive daily multivitamins for men, women, and seniors."),
            ("calcium-d3", "Calcium & Vitamin D3", "Bone density support, calcium carbonates, and cholecalciferol."),
            ("vitamin-c-immunity", "Vitamin C, Zinc & Immunity", "Immunity boosters, effervescent tablets, and antioxidant blends."),
            ("omega-3-fish-oil", "Omega-3 & Fish Oil", "EPA and DHA essential fatty acids for cardiovascular and brain health."),
            ("protein-supplements", "Protein Powders & Nutrition Drinks", "Whey protein, plant protein, and clinical nutritional supplements."),
        ],
    ),
    (
        "womens-health",
        "Women's Health & Maternal Care",
        "Prenatal vitamins, gynecological therapeutics, hormonal health, and feminine hygiene.",
        [
            ("prenatal-vitamins", "Prenatal & Folic Acid", "Essential prenatal formulas, DHA, and folate for pregnancy support."),
            ("iron-supplements", "Iron Supplements & Hematinics", "Ferrous ascorbate, iron tonics, and hemoglobin boosters."),
            ("feminine-hygiene", "Feminine Hygiene & Intimate Wash", "pH-balanced intimate washes and hygiene wipes."),
            ("menstrual-care", "Menstrual Care & Hygiene", "Sanitary pads, panty liners, tampons, and cramp relief patches."),
        ],
    ),
    (
        "pediatric-baby-care",
        "Baby Care & Pediatrics",
        "Infant nutrition, gentle baby toiletries, diapering essentials, and pediatric formulations.",
        [
            ("infant-nutrition", "Infant Nutrition & Baby Cereals", "Formula milk, weaning foods, and stage-wise infant nutrition."),
            ("diapers-wipes", "Diapers & Gentle Wipes", "Hypoallergenic diapers, pant-style diapers, and wet wipes."),
            ("pediatric-medicines", "Pediatric Drops & Syrups", "Pediatric paracetamol drops, colic relief, and pediatric tonics."),
            ("baby-skin-care", "Baby Bath & Skin Care", "Tear-free shampoos, baby lotions, massage oils, and diaper rash creams."),
        ],
    ),
    (
        "first-aid-wound-care",
        "First Aid & Emergency Care",
        "Wound dressings, antiseptic solutions, medical tapes, and emergency first aid supplies.",
        [
            ("antiseptic-liquids", "Antiseptic Liquids & Powders", "Povidone-iodine, chlorhexidine, and antiseptic solutions."),
            ("bandages-gauze", "Bandages, Cotton & Sterile Gauze", "Crepe bandages, absorbent cotton rolls, and sterile gauze swabs."),
            ("medical-tapes", "Medical Tapes & Adhesive Strips", "Micropore surgical tapes, waterproof adhesive dressings, and plasters."),
            ("burn-relief", "Burn Relief & Wound Healing", "Silver sulfadiazine creams and soothing burn relief dressings."),
        ],
    ),
    (
        "medical-devices",
        "Medical Devices & Home Healthcare",
        "Diagnostic equipment, monitoring tools, and respiratory home care devices.",
        [
            ("bp-monitors", "Blood Pressure Monitors", "Digital upper arm and wrist blood pressure monitors."),
            ("digital-thermometers", "Digital Thermometers", "Infrared forehead and digital contact thermometers."),
            ("pulse-oximeters", "Pulse Oximeters", "Fingertip pulse oximeters for measuring oxygen saturation and pulse rate."),
            ("nebulizers", "Nebulizers & Vaporizers", "Compressor nebulizers, facial vaporizers, and respiratory accessories."),
        ],
    ),
    (
        "ayurveda-herbal",
        "Ayurveda & Herbal Wellness",
        "Classical Ayurvedic formulations, herbal juices, immunity tonics, and natural remedies.",
        [
            ("chyawanprash-immunity", "Chyawanprash & Immunity Tonics", "Traditional Ayurvedic rasayanas for seasonal immunity."),
            ("herbal-juices", "Pure Herbal Juices", "Amla, aloe vera, giloy, karela, and triphala pure extract juices."),
            ("ayurvedic-tablets", "Ayurvedic Tablets & Churnas", "Classical single herb and polyherbal churnas, guggulu, and vati."),
            ("herbal-oils", "Medicated Herbal Oils & Balms", "Ayurvedic joint pain oils, hair oils, and herbal balms."),
        ],
    ),
    (
        "personal-care",
        "Personal Care & Daily Hygiene",
        "Oral hygiene, antiseptic hand washes, therapeutic hair care, and daily bath essentials.",
        [
            ("oral-care", "Oral Care & Toothpastes", "Medicated toothpastes, sensitive tooth care, dental floss, and mouthwashes."),
            ("hand-hygiene", "Hand Washes & Sanitizers", "Antibacterial foaming hand washes and alcohol-based hand sanitizers."),
            ("hair-care", "Therapeutic Hair Care", "Anti-dandruff shampoos, ketoconazole treatments, and hair serums."),
            ("bath-body", "Bath, Body & Skin Protection", "Gentle dermatological body washes, soaps, and moisturizing lotions."),
        ],
    ),
    (
        "elderly-mobility",
        "Elderly & Mobility Support",
        "Adult incontinence products, orthopaedic braces, and assistive mobility equipment.",
        [
            ("adult-diapers", "Adult Diapers & Underpads", "High-absorbency adult pull-up diapers and bed underpads."),
            ("mobility-aids", "Walking Aids & Mobility", "Ergonomic walking sticks, quadrupeds, and folding walkers."),
            ("ortho-supports", "Orthopaedic Belts & Joint Braces", "Lumbar sacro belts, cervical collars, and knee support sleeves."),
        ],
    ),
    (
        "ophthalmology-ent",
        "Eye, Ear & ENT Care",
        "Lubricant eye drops, ear drops, contact lens solutions, and vision care products.",
        [
            ("eye-drops", "Eye Drops & Lubricants", "Preservative-free artificial tears, lubricant gels, and soothing drops."),
            ("ear-drops", "Ear Drops & Wax Removers", "Ear drops for pain relief, wax dissolution, and microbial care."),
            ("lens-solutions", "Contact Lens Solutions", "Multi-purpose disinfecting and rinsing solutions for contact lenses."),
        ],
    ),
    (
        "neurology-psychiatry",
        "Neurology & Mental Health",
        "Prescription therapeutics for central nervous system, sleep, and neurological conditions.",
        [
            ("antiepileptics", "Antiepileptics & Anticonvulsants", "Medications for seizure disorders, epilepsy, and neuropathic pain."),
            ("neuroprotectives", "Neuroprotectives & Memory", "Cerebral circulation enhancers, citicoline, and nerve support."),
            ("sleep-aids", "Sleep Aids & Calming Formulations", "Medications and herbal aids for insomnia, stress, and sleep support."),
        ],
    ),
]


def seed_categories(clean_demo: bool = False) -> None:
    """Synchronously seed the full categories taxonomy into PostgreSQL."""
    db_url = settings.SYNC_DATABASE_URL
    if not db_url:
        db_url = settings.DATABASE_URL.replace("+asyncpg", "") if settings.DATABASE_URL else ""

    if not db_url:
        print("ERROR: DATABASE_URL is not configured in settings.", file=sys.stderr)
        sys.exit(1)

    print(f"Connecting to database...")
    engine = create_engine(db_url, echo=False)
    SessionLocal = sessionmaker(bind=engine)
    session: Session = SessionLocal()

    created_roots = 0
    updated_roots = 0
    created_subs = 0
    updated_subs = 0
    demo_cleaned = 0

    try:
        # Step 0: Optionally clean up demo categories
        if clean_demo:
            print("Cleaning up old demo categories (slugs starting with 'demo-')...")
            demo_categories = session.execute(
                select(Category).where(Category.slug.like("demo-%"))
            ).scalars().all()
            for demo_cat in demo_categories:
                demo_cat.is_active = False
                demo_cat.is_deleted = True
                demo_cleaned += 1
            session.flush()
            print(f"Archived {demo_cleaned} old demo categories.")

        # Step 1: Seed Root and Sub Categories
        total_groups = len(MASTER_CATEGORIES)
        print(f"\nProcessing {total_groups} primary categories and their subcategories...\n")

        root_order = 0
        for root_slug, root_name, root_desc, subcategories in MASTER_CATEGORIES:
            root_order += 10
            # Check if root category exists (including soft-deleted)
            root_cat = session.execute(
                select(Category).where(Category.slug == root_slug)
            ).scalars().first()

            if not root_cat:
                root_cat = Category(
                    name=root_name,
                    slug=root_slug,
                    description=root_desc,
                    is_active=True,
                    is_deleted=False,
                    deleted_at=None,
                    sort_order=root_order,
                    parent_id=None,
                )
                session.add(root_cat)
                session.flush()
                created_roots += 1
                status_icon = "[NEW ROOT]"
            else:
                # Update existing root
                root_cat.name = root_name
                root_cat.description = root_desc
                root_cat.is_active = True
                root_cat.is_deleted = False
                root_cat.deleted_at = None
                root_cat.sort_order = root_order
                root_cat.parent_id = None
                session.flush()
                updated_roots += 1
                status_icon = "[UPDATED ROOT]"

            print(f"{status_icon} {root_name} (slug: /{root_slug})")

            # Process subcategories
            sub_order = 0
            for sub_slug, sub_name, sub_desc in subcategories:
                sub_order += 10
                sub_cat = session.execute(
                    select(Category).where(Category.slug == sub_slug)
                ).scalars().first()

                if not sub_cat:
                    sub_cat = Category(
                        name=sub_name,
                        slug=sub_slug,
                        description=sub_desc,
                        is_active=True,
                        is_deleted=False,
                        deleted_at=None,
                        sort_order=sub_order,
                        parent_id=root_cat.id,
                    )
                    session.add(sub_cat)
                    session.flush()
                    created_subs += 1
                    print(f"    --> [NEW SUB] {sub_name} (slug: /{sub_slug})")
                else:
                    sub_cat.name = sub_name
                    sub_cat.description = sub_desc
                    sub_cat.is_active = True
                    sub_cat.is_deleted = False
                    sub_cat.deleted_at = None
                    sub_cat.sort_order = sub_order
                    sub_cat.parent_id = root_cat.id
                    session.flush()
                    updated_subs += 1
                    print(f"    --> [UPDATED SUB] {sub_name} (slug: /{sub_slug})")

        session.commit()
        print("\n" + "=" * 60)
        print(" CATEGORY SEEDING COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(f"Primary Categories Added   : {created_roots}")
        print(f"Primary Categories Updated : {updated_roots}")
        print(f"Subcategories Added        : {created_subs}")
        print(f"Subcategories Updated      : {updated_subs}")
        print(f"Total Active Categories    : {created_roots + updated_roots + created_subs + updated_subs}")
        if clean_demo:
            print(f"Demo Categories Archived   : {demo_cleaned}")
        print("=" * 60 + "\n")

    except Exception as e:
        session.rollback()
        print(f"\nERROR during category seeding: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(
        description="Med24Plus Category Taxonomy Seeder Utility"
    )
    parser.add_argument(
        "--clean-demo",
        action="store_true",
        help="Deactivate and archive previous demo categories starting with 'demo-'",
    )
    args = parser.parse_args()

    seed_categories(clean_demo=args.clean_demo)


if __name__ == "__main__":
    main()
