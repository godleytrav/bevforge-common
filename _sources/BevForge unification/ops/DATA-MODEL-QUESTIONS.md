# BevForge Data Model Questions & Recommendations

## Issues Discovered During Testing

### 1. ✅ FIXED: Batches Page Error
**Issue:** Batches page was crashing with mock data
**Fix:** Cleared mock data, batches API now returns empty array
**Status:** ✅ Fixed - batches page now shows empty state

---

### 2. 🔧 TO BUILD: Create New Order - Product Selection

**Current Issue:** 
- No way to select products from inventory when creating orders
- Need product picker with variants (6-pack, bottle, keg)

**What's Needed:**
- Product selection dropdown/search
- Variant selection (package type)
- Quantity input
- Real-time price calculation
- Stock availability check

**Recommendation:**
Build a proper "Create Order" form with:
1. Customer selection (from existing customers)
2. Product selection (from inventory)
3. Variant selection (can, bottle, keg)
4. Quantity input
5. Delivery date picker
6. Notes field
7. Auto-calculate total

---

### 3. 🤔 DATA MODEL QUESTION: Product Variants

**The Big Question:**
How should we handle different package types for the same product?

**Example:**
- Hoppy Trail IPA comes in:
  - 355ml Cans (24-pack case)
  - 330ml Bottles (24-pack case)
  - 50L Kegs (single unit)

**Option A: Separate Products (Current Approach)**
```
Product 1: Hoppy Trail IPA - Can (24x355ml)
Product 2: Hoppy Trail IPA - Bottle (24x330ml)
Product 3: Hoppy Trail IPA - Keg (50L)
```

**Pros:**
- ✅ Simple database structure
- ✅ Easy inventory tracking
- ✅ Each has own SKU, price, stock level

**Cons:**
- ❌ Duplicate product info (name, ABV, IBU, description)
- ❌ Hard to see "all IPA variants" together
- ❌ More products to manage

---

**Option B: Product + Variants (Recommended)**
```
Product: Hoppy Trail IPA
  Variant 1: Can (24x355ml) - SKU: IPA-CAN-355
  Variant 2: Bottle (24x330ml) - SKU: IPA-BTL-330
  Variant 3: Keg (50L) - SKU: IPA-KEG-50L
```

**Pros:**
- ✅ Single product with shared info (name, ABV, IBU, description)
- ✅ Easy to see all variants together
- ✅ Better for reporting ("total IPA sales across all packages")
- ✅ Industry standard (Shopify, WooCommerce use this)

**Cons:**
- ❌ More complex database structure
- ❌ Need to update schema

**Database Schema for Option B:**
```sql
products:
  - id
  - name (Hoppy Trail IPA)
  - description
  - abv
  - ibu
  - style
  - created_at

product_variants:
  - id
  - product_id (FK to products)
  - container_type_id (FK to container_types)
  - sku (IPA-CAN-355)
  - price
  - stock_quantity
  - is_active
  - created_at

container_types:
  - id (CAN-355, BTL-330, KEG-50L)
  - name (355ml Can, 330ml Bottle, 50L Keg)
  - type (can, bottle, keg)
  - size_ml
  - units_per_case
  - deposit_amount
```

---

### 4. 🤔 DATA MODEL QUESTION: Batch Numbers & Production

**The Big Question:**
When and how are batch numbers and keg IDs created?

**Current Understanding:**
- Batches are created during production (brewing/fermenting)
- Keg IDs are assigned when kegs are filled
- Both need to be tracked for compliance and quality control

**Recommended Flow:**

**Step 1: Create Production Batch**
```
User goes to: /ops/batches
Clicks: "Create New Batch"
Fills in:
  - Product: Hoppy Trail IPA
  - Volume: 500 gallons
  - Brew Date: Dec 24, 2025
  - Expected Completion: Jan 7, 2026
  - Yeast: US-05
  - Target ABV: 6.5%
  - Notes: Standard recipe

System generates:
  - Batch Number: BATCH-2025-001
  - Status: planned
```

**Step 2: Track Fermentation**
```
Status updates:
  - planned → brewing → fermenting → conditioning → ready
```

**Step 3: Package into Containers**
```
User goes to: /ops/batches/BATCH-2025-001
Clicks: "Package Batch"
Selects:
  - Container Type: 50L Keg
  - Quantity: 10 kegs

System generates:
  - Keg IDs: KEG-2025-001 through KEG-2025-010
  - Links kegs to batch number
  - Updates inventory: +10 kegs of Hoppy Trail IPA
  - Updates batch status: packaged
```

**Step 4: Kegs Available for Orders**
```
Now when creating orders:
  - Hoppy Trail IPA - Keg shows "10 in stock"
  - Each keg has traceability to BATCH-2025-001
```

---

### 5. 🎯 RECOMMENDATION: Implementation Priority

**Phase 1: Fix Immediate Issues (Now)**
- ✅ Fixed batches page error
- 🔧 Build "Create Order" form with product selection
- 🔧 Add stock availability indicators (in stock = normal, out of stock = gray)

**Phase 2: Product Variants (Next)**
- Update database schema to support variants
- Migrate existing products to new structure
- Update order creation to select variants
- Update inventory tracking

**Phase 3: Production & Batches (Later)**
- Build batch creation workflow
- Add fermentation tracking
- Build packaging workflow (batch → containers)
- Link containers to batches for traceability

---

## Current Database Schema (Simplified)

```
products:
  - id (PROD-001)
  - name (Hoppy Trail IPA)
  - description
  - abv, ibu, style
  - created_at

container_types:
  - id (CAN-355, BTL-330, KEG-50L)
  - name, type, size_ml
  - units_per_case
  - deposit_amount

orders:
  - id, order_number
  - customer_id
  - status, source
  - total_amount, deposit_amount
  - delivery_date

order_items:
  - id
  - order_id (FK)
  - product_id (FK)
  - container_type_id (FK)
  - quantity, unit_price
  - subtotal

locations (customers):
  - id (CUST-001)
  - name, type (customer)
  - contact_name, phone, email
  - address
```

---

## Questions for You

### 1. Product Variants
**Do you want to keep products separate (Option A) or implement variants (Option B)?**

**My recommendation:** Option B (variants) - it's more scalable and industry standard.

### 2. Batch Tracking
**Do you need full batch tracking now, or can we defer it to Phase 3?**

**My recommendation:** Defer to Phase 3. Focus on getting orders working first.

### 3. Keg Deposits
**How do you handle keg deposits?**
- Charged at order time? ✅ (current implementation)
- Refunded when keg returned?
- Tracked separately?

### 4. Stock Management
**How do you want to handle stock?**
- Manual entry (you update stock levels manually)?
- Auto-decrement (stock decreases when order delivered)?
- Batch-based (stock comes from packaging batches)?

**My recommendation:** Start with manual entry, add auto-decrement later.

---

## Next Steps - Your Choice

**Option 1: Build Create Order Form (Recommended)**
- Add product selection dropdown
- Add variant selection (if we go with Option B)
- Add quantity input
- Add stock availability indicators
- Auto-calculate totals

**Option 2: Implement Product Variants**
- Update database schema
- Migrate existing products
- Update all pages to show variants

**Option 3: Build Batch Production Workflow**
- Create batch creation form
- Add fermentation tracking
- Build packaging workflow

**What would you like to tackle first?**

---

## Summary

**You're NOT breaking the app!** You're discovering what needs to be built. This is exactly the right process.

**What's working:**
- ✅ Control dataset (3 orders, 3 products, 3 customers)
- ✅ Orders page displays correctly
- ✅ Order details show full information
- ✅ Inventory page shows products
- ✅ Canvas Logistics ready for approved orders
- ✅ Batches page no longer crashes

**What needs building:**
- 🔧 Create Order form with product selection
- 🔧 Stock availability indicators
- 🤔 Decision on product variants (Option A vs B)
- 🤔 Decision on batch tracking priority

**Let me know which direction you want to go, and I'll build it!** 🚀
