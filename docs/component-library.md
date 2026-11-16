# Med24Plus Component Library Documentation (Phase 2)

This document provides a comprehensive catalog of all reusable UI components and widgets created for **Customer Web**, **Admin Console**, and **Flutter Mobile**.

---

## 1. Customer Website Components (`frontend/customer-web/src/components/`)

### Foundation & Form Primitives (`components/ui/`)
- **`Button`**: Supports variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), disabled states, and full-width layout.
- **`IconButton`**: Icon-only button with circular or rounded corners, accessible `aria-label`, and size variants.
- **`Input`**: Text input with label, helper text, error state, and icon slot.
- **`SearchInput`**: Specialized search input with search icon, clear button, and debounce hook integration.
- **`Textarea`**: Multi-line text field for patient inquiries and addresses.
- **`Select`**: Native select wrapper with custom arrow styling and focus rings.
- **`Checkbox`**: Healthcare green check mark control with label and description.
- **`RadioButton`**: Radio choice selector for payment and address selection.

### Feedback, Overlays & Navigation
- **`Badge`**: Pill chips for counts, discounts, and categories.
- **`Card`**: Standardized container with 1px slate-200 border, rounded-xl, and subtle elevation.
- **`Modal`**: Backdrop-blurred modal dialog with header, body, footer, and ESC key dismiss.
- **`Drawer`**: Sliding side panel for mobile navigation and quick filters.
- **`Dropdown`**: Click-to-open menu for sorting and user profile actions.
- **`Tabs`**: Horizontal navigation tabs with active indicator underline and badge counts.
- **`Breadcrumb`**: Hierarchical page breadcrumb trail.
- **`Pagination`**: Previous/Next navigation with page numbers and active state.
- **`LoadingSkeleton`**: Shimmer animated placeholder boxes for catalog loading states.
- **`EmptyState`**: Centered icon, title, description, and action button.
- **`ErrorState`**: Warning illustration, error description, and retry action.
- **`Toast`**: Self-dismissing toast notifications with success/error/warning variants.
- **`ConfirmationDialog`**: Modal for destructive or critical actions (e.g. order cancellation).

### Pharmacy Domain Components
- **`ProductCard`**: Product tile featuring image, clinical schedule badge, brand, salt, pack size, price, MRP, discount percentage, and Add-to-Cart trigger.
- **`CategoryCard`**: Therapeutic category card with themed Lucide icon and item counts.
- **`PriceDisplay`**: Formatted INR price (`₹`), strikethrough MRP, and savings badge.
- **`QuantitySelector`**: Inline plus/minus buttons with current integer quantity display.
- **`PrescriptionBadge`**: Pill badge indicating `Rx Required`, `Schedule H`, or `OTC`.
- **`StatusBadge`**: Color-coded order status badges (`Pending Review`, `Packed`, `Dispatched`, `Delivered`).

---

## 2. Admin & Pharmacist Console Components (`frontend/admin-panel/src/components/`)

### Navigation & Layout
- **`Sidebar`**: Collapsible multi-level sidebar navigation with badge counters for pending orders and near-expiry batches.
- **`Header`**: Top operations bar with pharmacist duty status, notification bell, and store profile.
- **`AdminBreadcrumb`**: Hierarchical trail for deep settings and product edit pages.
- **`PageHeader`**: Standardized title, subtitle, status badge slot, and action buttons header.

### Data Display & Operations
- **`DashboardStatCard`**: Metric KPI card with title, numeric value, percentage trend, and Lucide icon.
- **`DataTable`**: Generic TypeScript data table (`DataTable<T>`) supporting arbitrary columns, custom cell renderers, and responsive horizontal scrolling.
- **`TableToolbar`**: Integrated search input, filter panel toggle, CSV export button, and action slot.
- **`FilterPanel`**: Expandable panel with multi-field dropdown filters and reset control.
- **`SearchToolbar`**: Quick search bar with instant clear icon.
- **`DateRangePicker`**: Start and end date range selector for GST and audit reports.
- **`StatusBadge`**: Operations badge supporting statuses: `ACTIVE`, `GOOD`, `NEAR_EXPIRY`, `LOW_STOCK`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `DELIVERED`, `SCHEDULE_H`, `SCHEDULE_H1`.
- **`FormSection`**: Grouped card section with title, explanatory description, and responsive grid layout.
- **`ConfirmationDialog`**: Warning modal for status changes, deactivations, and approvals.
- **`EmptyState` / `LoadingState`**: Fallback states for empty tables or asynchronous operations.

---

## 3. Flutter Customer Mobile Widgets (`mobile/customer-app/lib/core/widgets/`)

| Widget | File Path | Description & Features |
| :--- | :--- | :--- |
| **`AppButton`** | `lib/core/widgets/app_button.dart` | Primary, secondary, outline, and text variants with loading indicator support and full-width toggle. |
| **`AppTextField`** | `lib/core/widgets/app_text_field.dart` | Material 3 text field with label, hint, prefix icon, password visibility toggle, and error text. |
| **`AppCard`** | `lib/core/widgets/app_card.dart` | Container with `#E2E8F0` border, `#FFFFFF` background, rounded-12 corners, and tap ripple. |
| **`AppLoader`** | `lib/core/widgets/app_loader.dart` | Centered `#087F5B` circular progress indicator with optional message. |
| **`AppErrorWidget`** | `lib/core/widgets/app_error_widget.dart` | Error icon, title, description, and retry button. |
| **`AppEmptyWidget`** | `lib/core/widgets/app_empty_widget.dart` | Empty state illustration icon, title, and action CTA. |
| **`AppBadge`** | `lib/core/widgets/app_badge.dart` | Named constructors: `AppBadge.schedule('SCHEDULE_H')` and `AppBadge.orderStatus('Delivered')`. |
| **`AppAppBar`** | `lib/core/widgets/app_app_bar.dart` | Branded app bar with back navigation, action icons, and title. |
| **`ProductCard`** | `lib/core/widgets/product_card.dart` | Product grid tile with image, schedule tag, brand, title, pack size, price, and ADD button. |
| **`CategoryCard`** | `lib/core/widgets/category_card.dart` | Category icon, name, and product count pill. |
| **`PriceWidget`** | `lib/core/widgets/price_widget.dart` | INR symbol (`₹`), selling price, crossed-out MRP, and discount tag. |
| **`QuantitySelector`** | `lib/core/widgets/quantity_selector.dart` | Plus, minus, and quantity display with min/max limits. |
| **`AppBottomNavBar`** | `lib/core/widgets/bottom_nav_bar.dart` | 5-tab bottom navigation (Home, Categories, Search, Orders, Profile) with active `#087F5B` highlighting. |

