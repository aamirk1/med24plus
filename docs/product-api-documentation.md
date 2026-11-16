# Med24Plus Product & Taxonomy API Documentation

REST endpoints for public catalog browsing, category hierarchy, brand management, and administrative product curation.

---

## 1. Categories API

### 1.1 List Categories (Public)
- **Method**: `GET /api/v1/categories`
- **Query Parameters**:
  - `search` (string): Text filter on category name or description.
  - `parent_id` (UUID): Filter by parent category.
  - `only_root` (bool): If true, returns only top-level root categories.
  - `is_active` (bool): Defaults to `true` for public listing.
  - `page` (int, default 1), `page_size` (int, default 20).

### 1.2 Get Category (Public)
- **Method**: `GET /api/v1/categories/{category_id}`

### 1.3 Create Category (Admin)
- **Method**: `POST /api/v1/admin/categories`
- **Permission**: `categories.create`
- **Request Body**:
```json
{
  "name": "Cardiovascular Care",
  "slug": "cardiovascular-care",
  "description": "Antihypertensives, statins, and cardiac formulations",
  "image_url": "/static/uploads/categories/cardio.png",
  "parent_id": null,
  "sort_order": 1,
  "is_active": true
}
```

### 1.4 Update Category (Admin)
- **Method**: `PUT /api/v1/admin/categories/{category_id}`
- **Permission**: `categories.update`

### 1.5 Update Category Status (Admin)
- **Method**: `PATCH /api/v1/admin/categories/{category_id}/status`
- **Permission**: `categories.update`
- **Request Body**: `{"is_active": false}`

### 1.6 Delete Category (Admin)
- **Method**: `DELETE /api/v1/admin/categories/{category_id}`
- **Permission**: `categories.delete`

---

## 2. Brands API

### 2.1 List Brands (Public)
- **Method**: `GET /api/v1/brands`
- **Query Parameters**: `search`, `is_active`, `page`, `page_size`.

### 2.2 Get Brand (Public)
- **Method**: `GET /api/v1/brands/{brand_id}`

### 2.3 Create Brand (Admin)
- **Method**: `POST /api/v1/admin/brands`
- **Permission**: `brands.create`
- **Request Body**:
```json
{
  "name": "Cipla",
  "slug": "cipla",
  "manufacturer_name": "Cipla Pharmaceuticals Ltd.",
  "logo_url": null,
  "description": "Leading Indian multinational pharmaceutical company",
  "country_of_origin": "India",
  "is_active": true
}
```

### 2.4 Update Brand (Admin)
- **Method**: `PUT /api/v1/admin/brands/{brand_id}`
- **Permission**: `brands.update`

### 2.5 Delete Brand (Admin)
- **Method**: `DELETE /api/v1/admin/brands/{brand_id}`
- **Permission**: `brands.delete`

---

## 3. Products API

### 3.1 List Products (Public)
- **Method**: `GET /api/v1/products`
- **Query Parameters**:
  - `search`: Brand title, generic salt, SKU, composition.
  - `category_id`: Category UUID.
  - `brand_id`: Brand UUID.
  - `min_price`, `max_price`: Price filter bounds.
  - `prescription_required`: boolean.
  - `dosage_form`: Tablet, Syrup, Injection, Ointment, etc.
  - `sort_by`: `newest`, `name`, `price_asc`, `price_desc`.
  - `page`, `page_size`.
- **Response**: Paginated items with dynamically computed `is_in_stock` and `sellable_quantity`.

### 3.2 Get Product by Slug (Public)
- **Method**: `GET /api/v1/products/slug/{slug}`

### 3.3 Get Product by ID (Public)
- **Method**: `GET /api/v1/products/{product_id}`

### 3.4 Create Product (Admin)
- **Method**: `POST /api/v1/admin/products`
- **Permission**: `products.create`
- **Request Body**:
```json
{
  "name": "Augmentin 625 Duo Tablets",
  "sku": "AUG-625-DUO",
  "generic_name": "Amoxicillin and Potassium Clavulanate Tablets IP",
  "composition": "Amoxicillin 500mg + Clavulanic Acid 125mg",
  "category_id": "c1a2b3c4-0000-0000-0000-000000000001",
  "brand_id": "b1a2b3c4-0000-0000-0000-000000000001",
  "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd.",
  "pack_size": "10 Tablets / Strip",
  "dosage_form": "Tablet",
  "storage_temperature": "room_temperature",
  "is_cold_chain": false,
  "requires_prescription": true,
  "schedule_classification": "SCHEDULE_H",
  "is_restricted": false,
  "mrp": "205.50",
  "selling_price": "174.68",
  "hsn_code": "30041010",
  "gst_rate": "12.00",
  "is_active": true
}
```

### 3.5 Update Product (Admin)
- **Method**: `PUT /api/v1/admin/products/{product_id}`
- **Permission**: `products.update`

### 3.6 Toggle Product Status (Admin)
- **Method**: `PATCH /api/v1/admin/products/{product_id}/status`
- **Permission**: `products.manage_status`

### 3.7 Delete Product (Admin)
- **Method**: `DELETE /api/v1/admin/products/{product_id}`
- **Permission**: `products.delete`

### 3.8 Upload Product Image (Admin)
- **Method**: `POST /api/v1/admin/products/{product_id}/images`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Image binary (JPEG, PNG, WebP; max 5MB)
  - `alt_text` (optional)
  - `is_primary` (boolean)
  - `sort_order` (integer)

### 3.9 Designate Primary Image (Admin)
- **Method**: `PATCH /api/v1/admin/products/{product_id}/images/{image_id}/primary`

### 3.10 Remove Product Image (Admin)
- **Method**: `DELETE /api/v1/admin/products/{product_id}/images/{image_id}`

