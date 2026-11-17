# Med24Plus — Form 20 Cash Memo & GST Tax Invoice Specification

## 1. Regulatory & Statutory Framework

Under Indian Pharmacy Laws and Goods and Services Tax (GST) Acts, retail dispensing of pharmaceutical drugs mandates strict legal documentation:
1. **Rule 65(3) & 65(4) of the Drugs and Cosmetics Rules, 1945**:
   - Mandates a Cash/Credit Memo containing:
     - Name, address, and Drug License numbers of the retail pharmacy (Form 20 for non-scheduled/Schedule C/C1; Form 21 for Schedule C/C1).
     - Serial number of the cash/credit memo.
     - Date of supply.
     - Name and address of the purchaser (patient/customer).
     - Name of the drug, quantity, manufacturer, batch number, and expiry date.
     - Signature and registration number of the registered pharmacist supervising dispensing.
2. **Section 31 of the Central Goods and Services Tax (CGST) Act, 2017**:
   - Requires registered GSTIN, HSN Code (Harmonised System of Nomenclature), split taxable value, CGST%, SGST% (or IGST%), and grand total.
3. **Food Safety and Standards Act (FSSAI)**:
   - Retail dispensing of nutraceuticals, food supplements, and baby food requires displaying the pharmacy's FSSAI license number.

---

## 2. Pharmacy Legal Credentials Configured

In accordance with Med24Plus configuration, the statutory invoice headers contain:
- **Pharmacy Name**: Med24Plus Pharmacy (Unit of Med24 Health Solutions Private Limited)
- **Retail Address**: No. 42/1, 100 Feet Road, Indiranagar, Bengaluru, Karnataka, PIN: 560038
- **Drug License Numbers**:
  - Form 20: `KA-BLR-2024-DL00123`
  - Form 21: `KA-BLR-2024-DL00124`
- **GSTIN**: `29AABCM1234F1Z5`
- **FSSAI License No**: `11223334000567`
- **Supervising Pharmacist**: Pharmacist on duty (Karnataka State Pharmacy Council Registration: `KSPC-REG-2021-98745`)

---

## 3. Pure-Python PDF 1.4 Binary Architecture

To ensure 100% offline generation in secure sandbox and containerized production environments without external C-library dependencies (such as libwkhtmltox, Cairo, or Weasyprint), Med24Plus uses an internal, high-performance pure-Python PDF generator:
- **Module**: `backend/app/modules/orders/services/pdf_invoice_generator.py`
- **PDF Version**: `%PDF-1.4`
- **Standard Type-1 Fonts**: `Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`
- **Coordinates & Drawing**: Vector-based geometric rendering with text objects (`BT ... ET`), line drawing (`m ... l S`), and exact bounding boxes.
- **Cross-Reference Table**: Byte-exact xref table (`xref ... trailer`) calculated using exact stream offsets for standard PDF readers (Adobe Acrobat, Chrome, Safari, Preview).

---

## 4. Invoice Document Layout

```
+-----------------------------------------------------------------------------------+
|  MED24PLUS PHARMACY                           FORM 20 CASH MEMO & TAX INVOICE     |
|  Indiranagar, Bengaluru, KA - 560038          Invoice #: INV-20261117-001234      |
|  DL: KA-BLR-2024-DL00123 / DL00124            Order #:   ORD-20261117-009876      |
|  GSTIN: 29AABCM1234F1Z5 | FSSAI: 11223334000567 Date:   17 Nov 2026              |
+-----------------------------------------------------------------------------------+
|  PATIENT / BILL TO:                           DELIVERED TO:                       |
|  Aarav Sharma                                 123, 4th Cross, Indiranagar         |
|  Phone: +91 9876543210                        Bengaluru, Karnataka - 560038       |
+-----------------------------------------------------------------------------------+
| # | Medicine Name / Pack | HSN  | Batch | Expiry | Qty | Rate | Disc | GST% | Total |
+---+----------------------+------+-------+--------+-----+------+------+------+-------+
| 1 | Amoxicillin 500mg    | 3004 | B101  | 04/27  |  2  | 260  |  60  | 12%  | 515.2 |
+-----------------------------------------------------------------------------------+
|  TAX SUMMARY:                                 FINANCIAL TOTALS:                   |
|  Taxable Amount:  INR 460.00                  Items Subtotal:        INR 520.00   |
|  CGST (6%):       INR  27.60                  Discount Savings:    - INR  60.00   |
|  SGST (6%):       INR  27.60                  Tax Total (GST):     + INR  55.20   |
|                                               Delivery Charge:     + INR  30.00   |
|                                               ---------------------------------   |
|                                               NET PAYABLE (INR):     INR 545.20   |
+-----------------------------------------------------------------------------------+
|  RULE 65 DISPENSING CERTIFICATE:                                                  |
|  Dispensed by Registered Pharmacist: KSPC-REG-2021-98745                          |
|  Medicines once sold will only be accepted in case of statutory recalls.         |
|  Store medicines in cool, dry conditions as indicated on packaging.               |
+-----------------------------------------------------------------------------------+
```

---

## 5. Security & Storage Policies

1. **Storage Location**:
   - Invoices are saved on disk at `private_storage/invoices/INV-<date>-<hash>.pdf`.
   - The directory is isolated from public web static roots (`public/`), preventing unauthenticated downloads.
2. **Access Control**:
   - Customer endpoint `GET /api/v1/orders/{id}/invoice` verifies that the requesting customer owns the order (`ORDERS_VIEW_OWN`).
   - Pharmacists and Admins access invoices through `ORDERS_VIEW_INVOICE`.
3. **Immutability Guarantee**:
   - Invoices are generated once upon order placement/confirmation and remain strictly immutable. Even if product prices, taxes, or catalog names change in the future, the statutory invoice remains legally preserved.
