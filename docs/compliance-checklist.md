# Indian Pharmacy Regulatory & Compliance Checklist

## 1. Statutory Legislation References
- **The Drugs and Cosmetics Act, 1940**
- **The Drugs and Cosmetics Rules, 1945** (notably Rule 65 - Conditions of licences)
- **Pharmacy Practice Regulations, 2015** (Pharmacy Council of India)
- **Information Technology Act, 2000** & **Digital Personal Data Protection Act (DPDP), 2023**

---

## 2. Platform Compliance Matrix

| Rule / Requirement | Description | Platform Implementation |
| :--- | :--- | :--- |
| **Retail Drug Licence** | Dispensing must be tied to a valid Retail Drug Licence Form 20/21. | System records license number (`DL-KA-2026-PHAR-008472`) on all invoices, website headers, and mobile footers. |
| **Registered Pharmacist Supervision** | Every prescription sale must be verified under personal supervision of a Registered Pharmacist. | Role `PHARMACIST` required to countersign Rx approval before order can advance to packing. Pharmacist council registration number stamped on invoice. |
| **Schedule H & H1 Dispensing** | Requires valid prescription; Schedule H1 requires maintaining a separate register with patient details, doctor name, and batch numbers. | Dedicated `dispensing_audit_logs` table storing prescriber name, RMP council number, patient address, drug brand, batch, and dispensing pharmacist timestamp. |
| **Schedule X Narcotics & Habit-Forming Drugs** | Strictly regulated; online dispensing prohibited or tightly curbed. | Platform disallows checkout of Schedule X medications entirely, displaying regulatory warning to visit an offline clinic. |
| **Batch & Expiry Date on Bills** | Every sale bill must show drug trade name, batch number, manufacturer, and expiry date. | Database mandates `medicine_batches` allocation per `order_item`. Invoice generation renders full batch metadata and GST breakdown. |
| **Temperature-Sensitive Biologicals** | Cold chain (2°C–8°C) maintenance for insulin, vaccines, etc. | Flag `is_cold_chain = True` forces temperature-insulated packaging instructions and specialized delivery protocols. |
| **Patient Prescription Privacy** | Medical records are sensitive personal data under DPDP Act 2023. | Prescriptions are stored in private object storage, encrypted at rest, and accessible only via time-limited pre-signed URLs to authorized staff. |

