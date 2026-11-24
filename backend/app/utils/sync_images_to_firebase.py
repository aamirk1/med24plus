"""
Med24Plus - Firebase Storage & PostgreSQL Image Synchronizer
=============================================================
Uploads all catalog product images, category icons, and brand logos to Firebase Storage
at proper structured paths, and updates PostgreSQL database records with permanent public URLs.

Proper Firebase Storage Paths:
  - Products:   products/{product_id}/{slug}_{uuid}.png
  - Categories: categories/{category_slug}/{category_slug}_icon.png
  - Brands:     brands/{brand_slug}/{brand_slug}_logo.png

Usage (CLI):
  docker compose -f docker-compose.prod.yml exec backend python -m app.utils.sync_images_to_firebase
"""

import asyncio
import io
import logging
import os
import sys
import urllib.parse
import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product, ProductImage
from app.services.firebase_service import FirebaseService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SyncImagesToFirebase")


def generate_medicine_placeholder_svg(name: str, subtitle: str, color_hex: str = "#0052CC") -> bytes:
    """Generate a clean SVG placeholder image for medicines and pharmaceutical products."""
    safe_name = name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")[:40]
    safe_sub = subtitle.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")[:35]
    
    svg = f"""<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#EEF2F6"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{color_hex}"/>
      <stop offset="100%" stop-color="#00A88F"/>
    </linearGradient>
  </defs>
  
  <!-- Background Card -->
  <rect width="400" height="400" rx="28" fill="url(#bgGrad)" stroke="#E2E8F0" stroke-width="2"/>
  
  <!-- Pill Blister Pack Graphic -->
  <rect x="130" y="70" width="140" height="130" rx="20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
  <rect x="145" y="85" width="45" height="40" rx="10" fill="#E2E8F0"/>
  <rect x="210" y="85" width="45" height="40" rx="10" fill="#E2E8F0"/>
  <rect x="145" y="140" width="45" height="40" rx="10" fill="url(#primaryGrad)"/>
  <rect x="210" y="140" width="45" height="40" rx="10" fill="url(#primaryGrad)"/>

  <!-- Brand Cross Badge -->
  <circle cx="200" cy="230" r="18" fill="url(#primaryGrad)"/>
  <rect x="196" y="218" width="8" height="24" rx="3" fill="#FFFFFF"/>
  <rect x="188" y="226" width="24" height="8" rx="3" fill="#FFFFFF"/>

  <!-- Product Name & Detail -->
  <text x="200" y="285" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="800" fill="#0B2546" text-anchor="middle">{safe_name}</text>
  <text x="200" y="315" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#64748B" text-anchor="middle">{safe_sub}</text>

  <!-- Authenticity Stamp -->
  <rect x="120" y="340" width="160" height="26" rx="13" fill="#E8F7F3" stroke="#00A88F" stroke-width="1"/>
  <text x="200" y="357" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#008767" text-anchor="middle">✓ 100% Genuine Medicine</text>
</svg>"""
    return svg.encode("utf-8")


def generate_category_placeholder_svg(name: str, color_hex: str = "#0052CC") -> bytes:
    """Generate a clean SVG category icon."""
    safe_name = name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")[:30]
    svg = f"""<svg width="240" height="240" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F0FDF9"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="32" fill="url(#catGrad)" stroke="#CCFBF1" stroke-width="2"/>
  <circle cx="120" cy="100" r="45" fill="{color_hex}" fill-opacity="0.12"/>
  <!-- Cross Icon -->
  <rect x="112" y="75" width="16" height="50" rx="6" fill="{color_hex}"/>
  <rect x="95" y="92" width="50" height="16" rx="6" fill="{color_hex}"/>
  <text x="120" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#0B2546" text-anchor="middle">{safe_name}</text>
</svg>"""
    return svg.encode("utf-8")


def generate_brand_placeholder_svg(name: str, color_hex: str = "#0B2546") -> bytes:
    """Generate a clean SVG manufacturer brand logo."""
    safe_name = name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")[:35]
    svg = f"""<svg width="300" height="140" viewBox="0 0 300 140" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="140" rx="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  <rect x="16" y="24" width="8" height="92" rx="4" fill="{color_hex}"/>
  <text x="36" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="{color_hex}">{safe_name}</text>
  <text x="36" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748B">Certified Pharmaceutical Manufacturer</text>
</svg>"""
    return svg.encode("utf-8")


async def sync_all_images_to_firebase(db: AsyncSession) -> Dict[str, Any]:
    """
    Core sync routine that inspects PostgreSQL for non-Firebase images and uploads them
    with proper structured paths into Firebase Storage.
    """
    firebase_service = FirebaseService()

    if firebase_service.is_simulation_mode:
        msg = (
            "Firebase credentials not loaded. Please place backend/firebase-credentials.json "
            "or set FIREBASE_CREDENTIALS_BASE64 in .env.production before running sync."
        )
        logger.error(msg)
        return {
            "success": False,
            "message": msg,
            "products_updated": 0,
            "categories_updated": 0,
            "brands_updated": 0,
            "synced_items": [],
        }

    results = {
        "success": True,
        "message": "Firebase Storage synchronization completed.",
        "products_updated": 0,
        "categories_updated": 0,
        "brands_updated": 0,
        "synced_items": [],
    }

    # --------------------------------------------------------------------------
    # 1. Sync Product Images
    # --------------------------------------------------------------------------
    stmt_products = (
        select(ProductImage, Product)
        .join(Product, ProductImage.product_id == Product.id)
    )
    product_rows = (await db.execute(stmt_products)).all()

    for img, prod in product_rows:
        cur_url = (img.image_url or "").strip()
        # Skip if already uploaded to Firebase Storage
        if cur_url.startswith("https://firebasestorage.googleapis.com"):
            continue

        slug = prod.slug or "medicine"
        clean_slug = "".join(c for c in slug if c.isalnum() or c in ("-", "_"))[:40]
        proper_blob_path = f"products/{prod.id}/{clean_slug}_{uuid.uuid4().hex[:8]}.svg"

        # Check if local image file exists on disk
        local_content: Optional[bytes] = None
        content_type = "image/svg+xml"

        # Check common local paths
        candidates = [
            f"static/uploads/products/{os.path.basename(cur_url)}",
            f"static/uploads/{os.path.basename(cur_url)}",
            f"../frontend/med24plus-web/public/images/products/{clean_slug}.jpg",
            f"../frontend/med24plus-web/public/images/products/{clean_slug}.png",
            cur_url.lstrip("/"),
        ]

        for path in candidates:
            if os.path.exists(path) and os.path.isfile(path):
                try:
                    with open(path, "rb") as f:
                        local_content = f.read()
                    ext = os.path.splitext(path)[1].lower()
                    if ext in (".jpg", ".jpeg"):
                        content_type = "image/jpeg"
                        proper_blob_path = f"products/{prod.id}/{clean_slug}_{uuid.uuid4().hex[:8]}.jpg"
                    elif ext == ".png":
                        content_type = "image/png"
                        proper_blob_path = f"products/{prod.id}/{clean_slug}_{uuid.uuid4().hex[:8]}.png"
                    elif ext == ".webp":
                        content_type = "image/webp"
                        proper_blob_path = f"products/{prod.id}/{clean_slug}_{uuid.uuid4().hex[:8]}.webp"
                    break
                except Exception:
                    pass

        # If no local image on disk, generate high-quality vector artwork
        if not local_content or len(local_content) == 0:
            subtitle = prod.composition or prod.strength or prod.pack_size or "Tablets"
            local_content = generate_medicine_placeholder_svg(prod.name, subtitle)
            content_type = "image/svg+xml"

        # Upload to Firebase Storage
        success, fb_url, err = await firebase_service.upload_file(
            destination_blob_name=proper_blob_path,
            content=local_content,
            content_type=content_type,
            is_public=True,
        )

        if success and fb_url:
            img.image_url = fb_url
            results["products_updated"] += 1
            results["synced_items"].append({
                "type": "product",
                "name": prod.name,
                "path": proper_blob_path,
                "url": fb_url,
            })
            logger.info(f"[SYNC] Product '{prod.name}' -> {proper_blob_path}")
        else:
            logger.warning(f"[SYNC] Failed to upload product image for {prod.name}: {err}")

    # --------------------------------------------------------------------------
    # 2. Sync Category Images
    # --------------------------------------------------------------------------
    stmt_categories = select(Category)
    categories = (await db.execute(stmt_categories)).scalars().all()

    for cat in categories:
        cur_url = (cat.image_url or "").strip()
        if cur_url.startswith("https://firebasestorage.googleapis.com"):
            continue

        slug = cat.slug or "category"
        clean_slug = "".join(c for c in slug if c.isalnum() or c in ("-", "_"))[:40]
        proper_blob_path = f"categories/{clean_slug}/{clean_slug}_icon.svg"

        content = generate_category_placeholder_svg(cat.name)
        success, fb_url, err = await firebase_service.upload_file(
            destination_blob_name=proper_blob_path,
            content=content,
            content_type="image/svg+xml",
            is_public=True,
        )

        if success and fb_url:
            cat.image_url = fb_url
            results["categories_updated"] += 1
            results["synced_items"].append({
                "type": "category",
                "name": cat.name,
                "path": proper_blob_path,
                "url": fb_url,
            })
            logger.info(f"[SYNC] Category '{cat.name}' -> {proper_blob_path}")
        else:
            logger.warning(f"[SYNC] Failed to upload category image for {cat.name}: {err}")

    # --------------------------------------------------------------------------
    # 3. Sync Brand Logos
    # --------------------------------------------------------------------------
    stmt_brands = select(Brand)
    brands = (await db.execute(stmt_brands)).scalars().all()

    for brand in brands:
        cur_url = (brand.logo_url or "").strip()
        if cur_url.startswith("https://firebasestorage.googleapis.com"):
            continue

        slug = brand.slug or "brand"
        clean_slug = "".join(c for c in slug if c.isalnum() or c in ("-", "_"))[:40]
        proper_blob_path = f"brands/{clean_slug}/{clean_slug}_logo.svg"

        content = generate_brand_placeholder_svg(brand.name)
        success, fb_url, err = await firebase_service.upload_file(
            destination_blob_name=proper_blob_path,
            content=content,
            content_type="image/svg+xml",
            is_public=True,
        )

        if success and fb_url:
            brand.logo_url = fb_url
            results["brands_updated"] += 1
            results["synced_items"].append({
                "type": "brand",
                "name": brand.name,
                "path": proper_blob_path,
                "url": fb_url,
            })
            logger.info(f"[SYNC] Brand '{brand.name}' -> {proper_blob_path}")
        else:
            logger.warning(f"[SYNC] Failed to upload brand logo for {brand.name}: {err}")

    # Commit all changes to PostgreSQL
    await db.commit()
    logger.info(
        f"[SYNC COMPLETE] Products: {results['products_updated']}, "
        f"Categories: {results['categories_updated']}, "
        f"Brands: {results['brands_updated']}"
    )
    return results


async def main():
    logger.info("Starting Med24Plus Firebase Storage & Postgres DB Synchronizer...")
    async with AsyncSessionLocal() as session:
        res = await sync_all_images_to_firebase(session)
        print("\n" + "=" * 60)
        print(f"Status:             {res['message']}")
        print(f"Products Updated:   {res['products_updated']}")
        print(f"Categories Updated: {res['categories_updated']}")
        print(f"Brands Updated:     {res['brands_updated']}")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
