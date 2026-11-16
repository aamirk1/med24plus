# Med24Plus Complete UI Screen Inventory (Phase 2)

This inventory lists all completed UI/UX layouts implemented across the **Customer Website**, **Admin & Pharmacist Console**, and **Flutter Mobile Application**.

---

## 1. Customer Website (`frontend/customer-web`) — 22 Pages Completed

| # | Route | Screen Name | Key Layout Elements | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `/` | Homepage | 13 sections: Announcement bar, delivery pincode selector, global search, logo, Rx upload CTA, cart counter, hero banner, category grid, popular products, wellness promo, why choose us, ordering workflow, app download, newsletter, footer. | ✅ Verified |
| 2 | `/products` | Catalog & Search Results | Breadcrumb, search, category/brand/price filters, drug schedule chips, sort dropdown, responsive product grid, pagination, empty state. | ✅ Verified |
| 3 | `/products/[id]` | Product Details | High-res image gallery placeholder, brand/salt composition, pack size, pricing with MRP strikethrough, Schedule H warning, quantity selector, related items. | ✅ Verified |
| 4 | `/categories` | Category Index | 6 therapeutic categories with count badges, descriptions, quick links. | ✅ Verified |
| 5 | `/categories/[slug]` | Category Products | Filtered medicine listing for specific therapeutic conditions. | ✅ Verified |
| 6 | `/cart` | Shopping Cart | Itemized medicine list, quantity controls, Rx requirement warning banner, billing breakdown, coupon input, delivery threshold alert. | ✅ Verified |
| 7 | `/checkout` | 4-Step Checkout | Delivery address selector, prescription document attachment preview, payment mode (UPI, Cards, COD), simulated order placement. | ✅ Verified |
| 8 | `/prescription/upload` | 1-Tap Prescription Flow | Rule 65 statutory guidelines, drag-and-drop file upload, prescription guidelines checklist, simulated token creation. | ✅ Verified |
| 9 | `/account/orders` | Order History | Past order cards, delivery status badges, items summary, cash memo link. | ✅ Verified |
| 10 | `/account/orders/[id]` | Order Detail View | FEFO batch allocations, delivery address, courier fleet status, Form 20 cash memo values. | ✅ Verified |
| 11 | `/account/prescriptions` | Prescription Vault | Uploaded prescriptions, verification statuses (Pending Review, Approved). | ✅ Verified |
| 12 | `/account/addresses` | Address Book | Home & office address cards, default tag, add address trigger. | ✅ Verified |
| 13 | `/account/profile` | Patient Profile | Patient personal info, chronic condition tags, login credentials. | ✅ Verified |
| 14 | `/auth/login` | Patient Login | Mobile number OTP/password login, credentials helper text. | ✅ Verified |
| 15 | `/auth/register` | Patient Registration | Name, phone, email, pincode, terms checkbox, OTP button. | ✅ Verified |
| 16 | `/auth/forgot-password`| Password Recovery | Mobile number reset code trigger. | ✅ Verified |
| 17 | `/about` | About Pharmacy | Form 20/21 license credentials, supervising pharmacist details. | ✅ Verified |
| 18 | `/contact` | Contact & Helpline | Pharmacy phone, email, address, operating hours, inquiry form. | ✅ Verified |
| 19 | `/legal/prescription-policy`| Rx Policy | Rule 65 legal requirements, Schedule H/H1 audit rules. | ✅ Verified |
| 20 | `/legal/terms` | Terms of Sale | Statutory terms, warranty, return policies. | ✅ Verified |
| 21 | `/legal/privacy` | Privacy Policy | Patient data privacy, prescription storage security. | ✅ Verified |
| 22 | `/_not-found` | 404 Error Page | Healthcare themed page-not-found screen with search link. | ✅ Verified |

---

## 2. Admin & Pharmacist Operations Console (`frontend/admin-panel`) — 29 Pages Completed

| # | Route | Screen Name | Key Layout Elements | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `/dashboard` | Executive Overview | 8 KPI stat cards, sales velocity bar chart, recent orders table, FEFO batch expiry alerts, compliance badge. | ✅ Verified |
| 2 | `/catalog/products` | Medicine Catalog | SKU, dosage form, drug schedule, selling price vs MRP, stock levels, status filters. | ✅ Verified |
| 3 | `/catalog/products/new`| Add New Medicine | Salt composition, Drug Schedule (OTC/H/H1), GST rate (0/5/12/18%), HSN code, storage temperature. | ✅ Verified |
| 4 | `/catalog/products/[id]/edit` | Edit Medicine | Product detail updates, pricing alterations, deactivation controls. | ✅ Verified |
| 5 | `/catalog/categories` | Categories Taxonomy | Category name, slug, product counts, add/edit/deactivate actions. | ✅ Verified |
| 6 | `/catalog/brands` | Brands Directory | Pharmaceutical manufacturers, active SKU count, corporate offices. | ✅ Verified |
| 7 | `/inventory/stock` | Stock Management | Total SKUs, low stock warnings (&lt;20 units), out of stock alerts, purchase inward triggers. | ✅ Verified |
| 8 | `/inventory/batches` | Rule 65 Batch Register | Manufacturer batch number, mfg date, expiry date, days to expiry, FEFO allocation ledger. | ✅ Verified |
| 9 | `/inventory/expiries` | Expiry Quarantine | Expiry risk tiers (&lt;60 days, 60-180 days, &gt;180 days), quarantine actions. | ✅ Verified |
| 10 | `/orders` | Order Management | Filter tabs (All, Pending Review, Packed, Delivered, Cancelled), Rx indicator, amounts. | ✅ Verified |
| 11 | `/orders/[id]` | Order Dispensing View | Dispensed items with FEFO matched batch numbers, Form 20 cash memo print preview, courier assignment. | ✅ Verified |
| 12 | `/customers` | Customer Directory | Patient name, contact phone, total orders, lifetime spend, active status. | ✅ Verified |
| 13 | `/customers/[id]` | Customer Profile View | Detailed patient history, chronic care order records, delivery locations. | ✅ Verified |
| 14 | `/prescriptions` | Pharmacist Rx Queue | Pending Review, Approved, Rejected tabs, prescriber details, uploaded document tokens. | ✅ Verified |
| 15 | `/prescriptions/[id]` | Rx Audit Workbench | Scanned clinical document viewer preview, doctor credentials check, approval/rejection simulation. | ✅ Verified |
| 16 | `/delivery` | Dispatch Tracking | Active on-road dispatches, average delivery time, cold-chain temperature compliance. | ✅ Verified |
| 17 | `/delivery/partners` | Delivery Fleets | In-house cold-chain fleet and third-party local courier partners. | ✅ Verified |
| 18 | `/finance/payments` | Payment Transactions | UPI/Card/COD payment modes, gross revenue, 12% GST splits, bank settlement records. | ✅ Verified |
| 19 | `/finance/refunds` | Refunds & Returns | Out-of-stock and order cancellation reimbursement ledgers. | ✅ Verified |
| 20 | `/finance/reports` | Financial & Tax Reports| GSTR-1 monthly sales summary, Form 20 Schedule H audit report, inventory turn valuation. | ✅ Verified |
| 21 | `/marketing/coupons` | Coupons & Discounts | Promo code creator, discount type (percentage vs flat), minimum order limits. | ✅ Verified |
| 22 | `/marketing/banners` | Promotional Banners | Homepage and category banner management with expiry dates. | ✅ Verified |
| 23 | `/staff` | Staff Directory | Pharmacists, store managers, inventory clerks, role badges. | ✅ Verified |
| 24 | `/staff/pharmacists` | Registered Pharmacists | Pharmacy Council of India (PCI) registration numbers, Schedule H/H1 signing authority register. | ✅ Verified |
| 25 | `/settings/general` | General Settings | Pharmacy platform title, support email, emergency helpline, strict FEFO enforcement toggle. | ✅ Verified |
| 26 | `/settings/store` | Store Information | Form 20/21 drug licenses, GSTIN, FSSAI number, physical address, dispensing operating hours. | ✅ Verified |
| 27 | `/settings/delivery` | Delivery Settings | Free delivery threshold, standard shipping fee, serviceable Indian pincodes geofence. | ✅ Verified |
| 28 | `/settings/notifications`| Alert Preferences | SMS DLT alerts, WhatsApp prescription updates, email cash memos. | ✅ Verified |
| 29 | `/login` | Staff Access Portal | Authoritative staff authentication portal with pharmacist credential hints. | ✅ Verified |

---

## 3. Flutter Mobile Application (`mobile/customer-app`) — 20 Screen Layouts Completed

| # | Screen File | Feature / Route | Key UI Elements | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `splash_screen.dart` | `/splash` | Med24Plus healthcare cross & leaf icon, brand name, tagline, progress indicator. | ✅ Tested |
| 2 | `onboarding_screen.dart` | `/onboarding` | 3-slide value onboarding: Genuine Medicines, 1-Tap Prescription, Cold-Chain Delivery. | ✅ Tested |
| 3 | `login_screen.dart` | `/login` | Mobile number (+91), password field with visibility toggle, forgot password link, OTP button. | ✅ Tested |
| 4 | `register_screen.dart` | `/register` | Patient name, mobile, email, pincode, Rule 65 policy agreement checkbox, OTP trigger. | ✅ Tested |
| 5 | `forgot_password_screen.dart` | `/forgot-password` | Registered phone number input, reset code trigger. | ✅ Tested |
| 6 | `home_screen.dart` | `/home` | App bar with pincode, search bar, Form 20/21 license notice, 1-tap Rx card, category carousel, products grid. | ✅ Tested |
| 7 | `search_screen.dart` | `/search` | Live search input with clear button, real-time filtering, product results grid, empty state. | ✅ Tested |
| 8 | `categories_screen.dart` | `/categories` | 2-column therapeutic category grid with counts and themed healthcare icons. | ✅ Tested |
| 9 | `product_list_screen.dart` | `/products` | Category title, schedule filter chips (All, OTC, Schedule H, Devices, AYUSH), product grid. | ✅ Tested |
| 10 | `product_detail_screen.dart` | `/product/:id` | Image showcase, schedule warning chip, salt composition, description, price, quantity selector, add to cart. | ✅ Tested |
| 11 | `cart_screen.dart` | `/cart` | Itemized rows with quantity controls, Schedule H alert, price/MRP breakdown, checkout CTA. | ✅ Tested |
| 12 | `checkout_screen.dart` | `/checkout` | Delivery address summary, prescription attachment preview, payment selector (UPI, Card, COD), place order button. | ✅ Tested |
| 13 | `addresses_screen.dart` | `/addresses` | Saved addresses list (Home/Work), default badge, add address button. | ✅ Tested |
| 14 | `prescription_upload_screen.dart` | `/prescription-upload` | Rule 65 notice banner, Camera/Gallery buttons, file attachment pill, guidelines checklist, upload button. | ✅ Tested |
| 15 | `order_history_screen.dart` | `/orders` | Order cards with status badges, date, items count, total value. | ✅ Tested |
| 16 | `order_detail_screen.dart` | `/order/:id` | Order status, Rule 65 pharmacist review notice, FEFO batch allocations, payment summary. | ✅ Tested |
| 17 | `profile_screen.dart` | `/profile` | Patient avatar, name, phone, quick links to orders, prescriptions, addresses, sign out. | ✅ Tested |
| 18 | `notifications_screen.dart` | `/notifications` | Notification list with timestamp, read/unread states, order delivery & Rx updates. | ✅ Tested |
| 19 | `about_screen.dart` | `/about` | Pharmacy brand overview, Form 20/21 licenses, Supervising Pharmacist credentials. | ✅ Tested |
| 20 | `contact_screen.dart` | `/contact` | Emergency helpline, email, physical address, operating hours, message form. | ✅ Tested |
