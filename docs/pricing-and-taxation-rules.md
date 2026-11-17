# Med24Plus — Pricing & Statutory Taxation Rules

## 1. Regulatory Context (DPCO & Indian GST)

In India, pharmaceutical pricing and taxation are governed by:
1. **Drug Price Control Orders (DPCO)** under the Essential Commodities Act:
   - Sets National Ceiling Prices for scheduled formulations (National List of Essential Medicines - NLEM).
   - Retail Selling Price (inclusive of GST) cannot exceed the DPCO ceiling price or printed MRP.
2. **Indian Goods & Services Tax (GST) Act**:
   - Medicine MRP and retail prices are strictly **tax-inclusive** to the consumer.
   - Statutory GST rates on medicines:
     - **0%**: Life-saving human blood formulations, certain vaccines.
     - **5%**: Specific life-saving medicines, insulin, oral rehydration salts, diagnostic kits.
     - **12%**: Standard formulations, antibiotics, analgesics, antidiabetics, cardiac drugs.
     - **18%**: Medicated personal care, antiseptics, medicated shampoos, specialized medical equipment.

---

## 2. Tax Extraction Formula (Inclusive GST)

Because retail prices displayed to Indian consumers are inclusive of all taxes, the taxable value and statutory tax components must be extracted backward using exact Decimal arithmetic:

$$\text{Taxable Subtotal} = \frac{\text{Selling Subtotal}}{1 + \frac{\text{GST Rate}}{100}}$$

$$\text{Total GST Amount} = \text{Selling Subtotal} - \text{Taxable Subtotal}$$

### Intra-State Supply (Karnataka):
When supply originates from Bengaluru and is delivered within Karnataka:
$$\text{CGST Amount} = \text{SGST Amount} = \frac{\text{Total GST Amount}}{2}$$

### Inter-State Supply:
When delivered outside the origin state:
$$\text{IGST Amount} = \text{Total GST Amount}$$

---

## 3. Decimal Precision & Rounding Rules

1. All monetary quantities must use Python `Decimal` with `ROUND_HALF_UP`:
```python
TWOPLACES = Decimal("0.01")
rounded = amount.quantize(TWOPLACES, rounding=ROUND_HALF_UP)
```
2. Floating-point numbers (`float` in Python or JavaScript) are strictly prohibited for financial calculations.
3. Item-level discounts are calculated as:
$$\text{Discount} = (\text{Unit MRP} - \text{Unit Selling Price}) \times \text{Quantity}$$
$$\text{Subtotal} = \text{Unit Selling Price} \times \text{Quantity}$$

---

## 4. Delivery Charges & Surcharges

Delivery configuration is managed dynamically in the `checkout_settings` table:

1. **Standard Delivery Fee**:
   - Default: ₹40.00
   - Waived (₹0.00) when order subtotal meets or exceeds `free_delivery_threshold` (default ₹499.00).

2. **Express Cold-Chain Priority Fee**:
   - Default: ₹99.00
   - Applied when any item in the cart has `is_cold_chain = true` (e.g. Insulin, Hepatitis vaccines, biologics) requiring temperature-monitored gel packs and insulated containers.

3. **Grand Total Calculation**:
$$\text{Grand Total} = \text{Subtotal} + \text{Delivery Fee} + \text{Cold Chain Surcharge}$$

*Note*: Because item selling prices already include statutory GST, the subtotal already includes the tax amount. Tax is broken down transparently on the customer invoice and checkout summary without double-adding to the grand total.
