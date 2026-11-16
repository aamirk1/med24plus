# Med24Plus Design System & UI/UX Specification

## 1. Brand Identity & Design Direction

**Med24Plus** (*"Health. Always Within Reach."*) operates as a licensed single retail community pharmacy in India under the **Drugs and Cosmetics Act, 1940**, and **Drugs and Cosmetics Rules, 1945 (Rule 65)**.

The design communicates:
- **Trust & Reliability:** Authoritative healthcare presence, clear drug schedules (OTC, Schedule H, Schedule H1), and licensed pharmacist oversight.
- **Simplicity & Accessibility:** High-contrast legibility, streamlined 1-tap prescription uploads, and clear fee and GST breakdowns.
- **Professional Healthcare Aesthetic:** Clean whites, medical green/teal anchors, cool slate neutrals, avoiding cluttered gradients and noisy animations.

---

## 2. Color Palette & Design Tokens

### Primary Palette
| Token | Hex Value | Semantic Role | Tailwind / Flutter Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `#087F5B` | Healthcare teal/green, primary CTAs, active states | `bg-[#087F5B]`, `AppColors.primary` |
| **Primary Dark** | `#066649` | Deep teal, hero headers, hover states | `bg-[#066649]`, `AppColors.primaryDark` |
| **Primary Light** | `#E6F4EF` | Tinted background, badge backgrounds, icon containers | `bg-[#E6F4EF]`, `AppColors.primaryLight` |
| **Secondary** | `#2563EB` | Royal blue, informational badges, links | `bg-[#2563EB]`, `AppColors.secondary` |
| **Background** | `#F8FAFC` | Page body background (slate-50) | `bg-[#F8FAFC]`, `AppColors.background` |
| **Surface** | `#FFFFFF` | Cards, modals, drawers, input fields | `bg-white`, `AppColors.surface` |
| **Main Text** | `#172B24` | Primary headers and high-contrast body | `text-[#172B24]`, `AppColors.mainText` |
| **Secondary Text** | `#64748B` | Subtext, labels, captions, metadata | `text-[#64748B]`, `AppColors.secondaryText` |
| **Border** | `#E2E8F0` | Subtle hairline dividers, card outlines | `border-[#E2E8F0]`, `AppColors.border` |

### Functional Clinical Accents
| Token | Hex Value | Clinical / UI Meaning |
| :--- | :--- | :--- |
| **Success** | `#16A34A` | Delivered orders, approved prescriptions, in-stock indicators |
| **Warning** | `#D97706` | Schedule H prescription required, pending review, near expiry |
| **Danger** | `#DC2626` | Schedule H1 controlled alerts, rejected prescriptions, out of stock |

---

## 3. Typography & Hierarchy

The typography standard across web and mobile is **Inter** (`sans-serif`):

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Heading** | 36px – 48px | 800 (Extrabold) | 1.15 | Hero landing sections |
| **Page Heading (H1)** | 24px – 28px | 700 (Bold) | 1.25 | Screen headers, dashboard page titles |
| **Section Heading (H2)** | 18px – 20px | 700 (Bold) | 1.3 | Category sections, catalog filter headers |
| **Subheading (H3)** | 14px – 16px | 600 (Semibold) | 1.4 | Card headers, table column headers |
| **Body Standard** | 13px – 14px | 400 (Regular) | 1.5 | General descriptions, clinical salt details |
| **Caption / Meta** | 11px – 12px | 500 (Medium) | 1.4 | Batch numbers, expiries, delivery timestamps |
| **Micro-Badge** | 9px – 10px | 700 (Bold) | 1.0 | Schedule H / OTC chips, status pill badges |

---

## 4. Spacing, Grid & Breakpoints

- **Base Unit:** 4px spacing scale (8px, 12px, 16px, 20px, 24px, 32px, 48px).
- **Web Responsive Breakpoints:**
  - `sm`: 640px (Mobile landscape / large phones)
  - `md`: 768px (Tablets / drawer menu trigger)
  - `lg`: 1024px (Laptops / multi-column grids)
  - `xl`: 1280px (Standard desktops / container max width `7xl`)
- **Mobile Touch Targets:** Minimum 44px x 44px tap targets for all interactive buttons, icon buttons, and navigation elements.

---

## 5. Indian Healthcare Regulatory UX Rules

1. **Prescription Indicator:** Every medicine falling under Schedule H or H1 under Rule 65 prominently features an alert chip indicating doctor prescription requirement.
2. **First-Expiry-First-Out (FEFO):** Cash memos, order reviews, and inventory batch screens explicitly identify manufacturer batch numbers and shelf-life expiries.
3. **Statutory Disclaimers:** Visible Form 20/21 retail drug licenses, Supervising Pharmacist council registration number (`PCI-REG-94821`), and GSTIN are displayed on order documents and footers.

