# BevForge Control Dataset

## Purpose

This document describes the **CONTROL DATASET** used for testing the BevForge OPS system. This is a minimal, realistic dataset that simulates 3 incoming orders from different sources (web, phone, email) to test the complete order-to-delivery workflow.

**⚠️ IMPORTANT:** This is test data only and should be deleted after testing is complete.

---

## Dataset Overview

### Products (3 items)

| ID | SKU | Name | Type | Container | Price | Stock | Status |
|----|-----|------|------|-----------|-------|-------|--------|
| PROD-001 | IPA-KEG-50L | Hoppy Trail IPA | Beer | 50L Keg | $180.00 | 25 | Active |
| PROD-002 | LAGER-CASE-24 | Golden Lager | Beer | Case (24x330ml) | $48.00 | 100 | Active |
| PROD-003 | STOUT-KEG-30L | Dark Night Stout | Beer | 30L Keg | $120.00 | 15 | Active |

### Orders (3 items)

#### Order #1: Web Order (System Generated)
- **Order ID:** ORD-WEB-001
- **Order Number:** WEB-2025-001
- **Customer:** Downtown Pub (CUST-001)
- **Source:** Web (system-generated)
- **Status:** draft
- **Order Date:** 2025-12-24T08:00:00Z
- **Delivery Date:** 2025-12-26T10:00:00Z
- **Line Items:**
  - Hoppy Trail IPA (50L Keg) x 2 @ $180.00 = $360.00
- **Total Amount:** $360.00
- **Deposit Amount:** $100.00 (2 kegs @ $50 each)
- **Notes:** "Automated web order - requires approval"

#### Order #2: Phone Order (Manual Entry)
- **Order ID:** ORD-PHONE-001
- **Order Number:** PHONE-2025-001
- **Customer:** Riverside Restaurant (CUST-002)
- **Source:** Phone (manually entered by staff)
- **Status:** confirmed
- **Order Date:** 2025-12-24T09:30:00Z
- **Delivery Date:** 2025-12-27T14:00:00Z
- **Line Items:**
  - Golden Lager (Case 24x330ml) x 5 @ $48.00 = $240.00
- **Total Amount:** $240.00
- **Deposit Amount:** $0.00 (no deposit on cases)
- **Notes:** "Phone order from manager - confirmed delivery time"

#### Order #3: Email Order (Manual Entry)
- **Order ID:** ORD-EMAIL-001
- **Order Number:** EMAIL-2025-001
- **Customer:** City Bar & Grill (CUST-003)
- **Source:** Email (manually entered by staff)
- **Status:** approved
- **Order Date:** 2025-12-24T10:15:00Z
- **Delivery Date:** 2025-12-25T16:00:00Z
- **Line Items:**
  - Dark Night Stout (30L Keg) x 1 @ $120.00 = $120.00
  - Golden Lager (Case 24x330ml) x 2 @ $48.00 = $96.00
- **Total Amount:** $216.00
- **Deposit Amount:** $50.00 (1 keg @ $50)
- **Notes:** "Email order - urgent delivery for Christmas event"

### Customers (3 items)

| ID | Name | Type | Contact | Phone | Email |
|----|------|------|---------|-------|-------|
| CUST-001 | Downtown Pub | customer | Mike Johnson | (555) 123-4567 | mike@downtownpub.com |
| CUST-002 | Riverside Restaurant | customer | Sarah Chen | (555) 234-5678 | sarah@riverside.com |
| CUST-003 | City Bar & Grill | customer | Tom Martinez | (555) 345-6789 | tom@citybargrill.com |

---

## System Integration Points

### 1. Orders Page (`/ops/orders`)
- **Should display:** All 3 orders
- **Stats:**
  - Total Orders: 3
  - Pending: 1 (draft status)
  - Processing: 2 (confirmed + approved)
  - Total Revenue: $816.00

### 2. Sales Page (`/ops/sales`)
- **Should display:** Revenue data from orders
- **Total Sales:** $816.00
- **Orders by Source:**
  - Web: 1 order ($360.00)
  - Phone: 1 order ($240.00)
  - Email: 1 order ($216.00)

### 3. Canvas Logistics (`/ops/canvas-logistics`)
- **Should display:** Order #3 (approved status only)
- **Containers Generated:**
  - 1x 30L Keg (Stout)
  - 2x Case (Lager)
- **Customer:** City Bar & Grill
- **Delivery Date:** 2025-12-25

### 4. Inventory Page (`/ops/inventory`)
- **Should display:** 3 products with stock levels
- **Products:**
  - Hoppy Trail IPA: 25 units
  - Golden Lager: 100 units
  - Dark Night Stout: 15 units

### 5. Calendar Page (`/suites/ops/calendar`)
- **Should display:** 3 delivery events
- **Events:**
  - Dec 25: City Bar & Grill delivery
  - Dec 26: Downtown Pub delivery
  - Dec 27: Riverside Restaurant delivery

### 6. Notifications Page (`/notifications`)
- **Should display:** 3 new order notifications
- **Notifications:**
  - "New web order received from Downtown Pub"
  - "Phone order confirmed for Riverside Restaurant"
  - "Email order approved for City Bar & Grill"

---

## Testing Workflow

### Phase 1: Verify Empty State
1. Navigate to `/ops/orders` - should show "No orders found"
2. Navigate to `/ops/inventory` - should show "No products found"
3. Navigate to `/ops/canvas-logistics` - should show empty canvas

### Phase 2: Add Control Dataset
1. Run control dataset script to populate data
2. Verify all 3 products appear in inventory
3. Verify all 3 orders appear in orders page

### Phase 3: Test Order Workflow
1. **Draft Order (Web):**
   - View ORD-WEB-001 in orders page
   - Verify status is "draft"
   - Approve order → status changes to "approved"
   - Verify appears in canvas logistics

2. **Confirmed Order (Phone):**
   - View ORD-PHONE-001 in orders page
   - Verify status is "confirmed"
   - Approve order → status changes to "approved"
   - Verify appears in canvas logistics

3. **Approved Order (Email):**
   - View ORD-EMAIL-001 in orders page
   - Verify status is "approved"
   - Verify already appears in canvas logistics
   - Pack order → status changes to "packed"
   - Load order → status changes to "loaded"
   - Deliver order → status changes to "delivered"

### Phase 4: Test Canvas Logistics
1. Navigate to `/ops/canvas-logistics`
2. Verify approved order appears
3. Verify containers are generated correctly
4. Test drag-and-drop packing workflow
5. Generate pallet
6. Print QR codes
7. Mark as loaded

### Phase 5: Verify Integration
1. Check sales page shows correct revenue
2. Check calendar shows delivery dates
3. Check notifications show order alerts
4. Verify inventory updates after orders

---

## Cleanup Instructions

### To Remove Control Dataset:

1. **Delete Orders:**
   ```
   DELETE FROM order_line_items WHERE order_id IN ('ORD-WEB-001', 'ORD-PHONE-001', 'ORD-EMAIL-001');
   DELETE FROM orders WHERE id IN ('ORD-WEB-001', 'ORD-PHONE-001', 'ORD-EMAIL-001');
   ```

2. **Delete Products:**
   ```
   DELETE FROM products WHERE id IN ('PROD-001', 'PROD-002', 'PROD-003');
   ```

3. **Delete Customers:**
   ```
   DELETE FROM locations WHERE id IN ('CUST-001', 'CUST-002', 'CUST-003');
   ```

4. **Delete Containers/Pallets:**
   ```
   DELETE FROM containers WHERE product_id IN ('PROD-001', 'PROD-002', 'PROD-003');
   DELETE FROM pallets WHERE id LIKE 'PALLET-TEST-%';
   ```

5. **Delete Notifications:**
   ```
   DELETE FROM alerts WHERE entity_id IN ('ORD-WEB-001', 'ORD-PHONE-001', 'ORD-EMAIL-001');
   ```

---

## Expected Results

### Orders Page Stats
- **Total Orders:** 3
- **Pending:** 1 (draft)
- **Processing:** 2 (confirmed + approved)
- **Fulfilled:** 0
- **Total Revenue:** $816.00

### Sales Breakdown
- **Web Orders:** $360.00 (44%)
- **Phone Orders:** $240.00 (29%)
- **Email Orders:** $216.00 (27%)

### Inventory Impact
After orders are fulfilled:
- **Hoppy Trail IPA:** 25 → 23 units (-2)
- **Golden Lager:** 100 → 93 units (-7)
- **Dark Night Stout:** 15 → 14 units (-1)

---

## Notes

- **Timestamps:** All orders dated 2025-12-24 (today)
- **Delivery Dates:** Spread across Dec 25-27
- **Realistic Amounts:** Based on typical brewery pricing
- **Order Sources:** Mix of automated (web) and manual (phone/email)
- **Status Variety:** Draft, confirmed, approved to test workflow
- **Product Mix:** Kegs and cases to test different container types
- **Deposit Tracking:** Kegs have deposits, cases don't

---

## Implementation Status

- ✅ Mock data removed from APIs
- ✅ Control dataset documented
- ⏳ Products to be added
- ⏳ Orders to be added
- ⏳ Customers to be added
- ⏳ Notifications to be added
- ⏳ Calendar events to be added

---

**Last Updated:** 2025-12-24
**Status:** In Progress
**Purpose:** Testing & Validation
