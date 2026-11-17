# Med24Plus — Mobile Cart & Checkout API Contracts

## 1. Overview for Flutter Mobile Client

This document defines the REST API contracts and data models for integrating the Flutter mobile app (`mobile/customer-app`) with Phase 7 Cart and Checkout preparation endpoints.

The mobile app must continue using **flutter_bloc**, **Equatable**, and **Dio** without migrating to other state-management libraries.

---

## 2. API Endpoints for Mobile Client

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/v1/cart` | `GET` | Yes (Customer) | Fetch active shopping cart with live calculations |
| `/api/v1/cart/items` | `POST` | Yes (Customer) | Add item to cart `{ product_id, quantity }` |
| `/api/v1/cart/items/{item_id}` | `PATCH` | Yes (Customer) | Update item quantity `{ quantity }` |
| `/api/v1/cart/items/{item_id}` | `DELETE` | Yes (Customer) | Remove single item from cart |
| `/api/v1/cart/items` | `DELETE` | Yes (Customer) | Clear all items from cart |
| `/api/v1/addresses` | `GET` | Yes (Customer) | List saved customer delivery destinations |
| `/api/v1/addresses` | `POST` | Yes (Customer) | Save new customer delivery address |
| `/api/v1/addresses/{id}/set-default` | `POST` | Yes (Customer) | Mark address as primary default |
| `/api/v1/checkout/validate` | `POST` | Yes (Customer) | Generate authoritative 15-minute checkout quote |
| `/api/v1/checkout/serviceability/{pin}` | `GET` | No | Check if PIN code is within delivery geofence |

---

## 3. Flutter Dart Models (Suggested Contracts)

### 3.1 Cart Item Model
```dart
class CartItemModel extends Equatable {
  final String id;
  final String productId;
  final String productName;
  final String productSku;
  final String packSize;
  final String dosageForm;
  final String? brandName;
  final bool isColdChain;
  final double unitPrice;
  final double unitMrp;
  final bool isPriceChanged;
  final double? previousPrice;
  final int quantity;
  final double subtotal;
  final double discountAmount;
  final bool isAvailable;
  final int sellableStock;
  final bool requiresPrescription;
  final String scheduleClassification;
  final String prescriptionStatus;
  final String validationStatus;

  const CartItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.packSize,
    required this.dosageForm,
    this.brandName,
    required this.isColdChain,
    required this.unitPrice,
    required this.unitMrp,
    required this.isPriceChanged,
    this.previousPrice,
    required this.quantity,
    required this.subtotal,
    required this.discountAmount,
    required this.isAvailable,
    required this.sellableStock,
    required this.requiresPrescription,
    required this.scheduleClassification,
    required this.prescriptionStatus,
    required this.validationStatus,
  });

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      id: json['id'] as String,
      productId: json['product_id'] as String,
      productName: json['product_name'] as String,
      productSku: json['product_sku'] as String,
      packSize: json['pack_size'] as String,
      dosageForm: json['dosage_form'] as String,
      brandName: json['brand_name'] as String?,
      isColdChain: json['is_cold_chain'] as bool? ?? false,
      unitPrice: (json['unit_price'] as num).toDouble(),
      unitMrp: (json['unit_mrp'] as num).toDouble(),
      isPriceChanged: json['is_price_changed'] as bool? ?? false,
      previousPrice: (json['previous_price'] as num?)?.toDouble(),
      quantity: json['quantity'] as int,
      subtotal: (json['subtotal'] as num).toDouble(),
      discountAmount: (json['discount_amount'] as num).toDouble(),
      isAvailable: json['is_available'] as bool? ?? true,
      sellableStock: json['sellable_stock'] as int? ?? 0,
      requiresPrescription: json['requires_prescription'] as bool? ?? false,
      scheduleClassification: json['schedule_classification'] as String? ?? 'otc',
      prescriptionStatus: json['prescription_status'] as String? ?? 'not_required',
      validationStatus: json['validation_status'] as String? ?? 'valid',
    );
  }

  @override
  List<Object?> get props => [id, productId, quantity, unitPrice, isAvailable];
}
```

### 3.2 Checkout Validation Model
```dart
class CheckoutValidationModel extends Equatable {
  final String id;
  final String cartId;
  final String? deliveryAddressId;
  final String validationStatus; // 'valid', 'valid_with_warnings', 'blocked'
  final bool isEligibleForCheckout;
  final bool isAddressServiceable;
  final String? serviceabilityMessage;
  final int? estimatedDeliveryHours;
  final double subtotal;
  final double discountTotal;
  final double taxTotal;
  final double deliveryFee;
  final double grandTotal;
  final List<CartItemModel> items;
  final List<String> warnings;
  final List<String> blockingErrors;
  final DateTime calculatedAt;
  final DateTime expiresAt;

  const CheckoutValidationModel({
    required this.id,
    required this.cartId,
    this.deliveryAddressId,
    required this.validationStatus,
    required this.isEligibleForCheckout,
    required this.isAddressServiceable,
    this.serviceabilityMessage,
    this.estimatedDeliveryHours,
    required this.subtotal,
    required this.discountTotal,
    required this.taxTotal,
    required this.deliveryFee,
    required this.grandTotal,
    required this.items,
    required this.warnings,
    required this.blockingErrors,
    required this.calculatedAt,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  @override
  List<Object?> get props => [id, cartId, validationStatus, isEligibleForCheckout, grandTotal];
}
```

---

## 4. Mobile BLoC Event Flow

```
[User opens CartScreen]
       |
       v
 CartBloc.add(FetchCartEvent())
       |
       v
 CartLoadedState(cart: CartModel)
       |
       |--> Quantity changed: CartBloc.add(UpdateCartItemQuantityEvent(id, qty))
       |--> Checkout tapped: context.push('/checkout')
                                    |
                                    v
 CheckoutBloc.add(ValidateCheckoutEvent(addressId: selectedAddressId))
       |
       v
 CheckoutValidationState(quote: CheckoutValidationModel)
       |
       |--> If blocked: show blockingErrors & disable proceed
       |--> If valid: display 15-minute countdown and proceed button (Phase 8 payment)
```
