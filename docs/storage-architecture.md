# Med24Plus Object Storage Architecture

Architecture for public product media assets and private statutory medical prescriptions.

---

## 1. Storage Isolation Model

```
+---------------------------------------------------------------------------------+
|                                MED24PLUS STORAGE ARCHITECTURE                    |
+---------------------------------------------------------------------------------+
           |                                                      |
           v                                                      v
  [Public Product Media]                                 [Private Prescriptions]
  - Packaging photos & blister cards                     - Patient clinical prescriptions
  - Public read CDN / Local Static URL                   - Zero public URLs / Encrypted at rest
  - Path: `/static/uploads/products/`                    - Bucket: `med24plus-private-prescriptions`
  - Or S3 Bucket: `med24plus-public-products`            - Access: 15-min presigned URLs only
```

---

## 2. Product Image Validation & Security

Before saving any product photo:
1. **MIME Type Validation**:
   Only `image/jpeg`, `image/png`, and `image/webp` are permitted.
2. **Extension Check**:
   `.jpg`, `.jpeg`, `.png`, `.webp`.
3. **File Size Limit**:
   Strict cap of 5 MB (5,242,880 bytes).
4. **Execution Protection**:
   Files are never stored with executable permissions or original arbitrary user filenames. A secure UUID filename is assigned:
   `{product_id}_{uuid_hex[:12]}.{ext}`.
5. **Database Storage**:
   Binary images are **never stored as BLOBs** in PostgreSQL. Only the normalized URI path is persisted.

