# Med24Plus Expiry Horizon & Disposal Monitoring

This document details statutory compliance monitoring for medicine expiration under the **Drugs and Cosmetics Rules, 1945**.

---

## 1. Expiry Brackets & Statutory Actions

| Horizon | Risk Tier | Clinical & Operational Action |
| :--- | :--- | :--- |
| **Expired** ($\le 0$ days) | **Severe Violation** | Automatically excluded from sellable stock. Immediate physical withdrawal to segregated disposal lockup. |
| **Critical** ($\le 30$ days) | High Risk | Flagged in Admin Expiry Console. Barred from 30-day chronic medicine dispensations. |
| **Warning** ($\le 60$ days) | Moderate Risk | Prioritized for immediate FEFO dispensing on short acute prescriptions. |
| **Horizon** ($\le 90$ days) | Proactive | Clearance alerts raised to purchasing department for return-to-vendor (RTV) credit note processing. |

---

## 2. Real-Time Expiry Calculation Policy

- Expiry dates are stored as statutory `DATE` objects in UTC.
- Real-time comparison uses the current pharmacy operating date (`CURRENT_DATE` in SQL / `date.today()` in Python).
- Days to expiry is computed as:
  $$\text{days\_to\_expiry} = \text{expiry\_date} - \text{today}$$
- The system **never silently deletes** expired records from the database to preserve historical legal audit ledgers for the State Drug Control Administration.

