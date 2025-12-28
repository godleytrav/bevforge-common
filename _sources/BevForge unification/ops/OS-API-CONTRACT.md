# OS API CONTRACT

## Overview

This document defines the API contract between **OS (Operating System)** and **OPS (Operations)** modules.

**Architecture Principle:**
- **OS** = Source of truth for physical inventory (batches, materials, quantities)
- **OPS** = Business layer (customers, orders, pricing, invoicing)
- **OPS reads from OS API, never duplicates physical quantities**

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  OS (Operating System) - Production Control                  │
│  ├── Items (materials + finished goods)                      │
│  ├── Lots (batch tracking)                                   │
│  ├── Locations (warehouse bins)                              │
│  ├── Inventory Ledger (every movement)                       │
│  ├── Batches (production runs)                               │
│  ├── Batch Material Usage (BOM consumption)                  │
│  └── Batch Outputs (what was produced)                       │
│                                                               │
│  Provides: "Can I make this batch? What do I physically have?"│
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ API Calls
                              │ (Read Only)
                              │
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  OPS (Operations) - Business Layer                           │
│  ├── Customers                                               │
│  ├── Orders                                                  │
│  ├── Invoices                                                │
│  ├── Vendors                                                 │
│  ├── Purchase Orders                                         │
│  ├── Item Business Profile (SKU, pricing, reorder rules)    │
│  └── Cost Layers (FIFO/COGS - derived from OS movements)    │
│                                                               │
│  Provides: "What should we buy/sell? What did it cost?"      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Required OS API Endpoints

### 1. Items (Products/Materials)

**GET /api/os/items**
```typescript
interface OSItem {
  id: string;
  name: string;
  type: 'material' | 'finished_good' | 'packaging';
  unit_of_measure: string;
  category?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

Response: OSItem[]
```

**GET /api/os/items/:itemId**
```typescript
Response: OSItem
```

---

### 2. Inventory On-Hand

**GET /api/os/inventory/on-hand**
```typescript
interface InventoryOnHand {
  item_id: string;
  location_id: string;
  quantity: number;
  unit_of_measure: string;
  last_updated: string;
}

Query Parameters:
- item_id?: string (filter by item)
- location_id?: string (filter by location)

Response: InventoryOnHand[]
```

**GET /api/os/inventory/on-hand/:itemId**
```typescript
Response: {
  item_id: string;
  total_quantity: number;
  by_location: Array<{
    location_id: string;
    location_name: string;
    quantity: number;
  }>;
}
```

---

### 3. Batches

**GET /api/os/batches**
```typescript
interface OSBatch {
  id: string;
  batch_number: string;
  item_id: string; // Finished good produced
  brew_date: string;
  package_date?: string;
  best_by_date?: string;
  status: 'planning' | 'brewing' | 'fermenting' | 'conditioning' | 'packaging' | 'completed' | 'cancelled';
  quantity_produced: number;
  unit_of_measure: string;
  quality_status: 'pending' | 'passed' | 'failed' | 'quarantine';
  notes?: string;
  created_at: string;
  updated_at: string;
}

Query Parameters:
- status?: string
- item_id?: string
- from_date?: string
- to_date?: string

Response: OSBatch[]
```

**GET /api/os/batches/:batchId**
```typescript
Response: {
  batch: OSBatch;
  materials_used: Array<{
    item_id: string;
    item_name: string;
    quantity_used: number;
    unit_of_measure: string;
  }>;
  outputs: Array<{
    item_id: string;
    item_name: string;
    quantity_produced: number;
    unit_of_measure: string;
  }>;
}
```

---

### 4. Inventory Movements (Audit Trail)

**GET /api/os/inventory/movements**
```typescript
interface InventoryMovement {
  id: string;
  item_id: string;
  from_location_id?: string;
  to_location_id: string;
  quantity: number;
  unit_of_measure: string;
  movement_type: 'receipt' | 'production' | 'transfer' | 'adjustment' | 'consumption' | 'shipment';
  reference_type?: 'batch' | 'order' | 'adjustment';
  reference_id?: string;
  performed_by: string;
  notes?: string;
  timestamp: string;
}

Query Parameters:
- item_id?: string
- location_id?: string
- from_date?: string
- to_date?: string
- movement_type?: string

Response: InventoryMovement[]
```

---

### 5. Locations

**GET /api/os/locations**
```typescript
interface OSLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'production' | 'staging' | 'shipping';
  is_active: boolean;
  created_at: string;
}

Response: OSLocation[]
```

---

### 6. Lots (Optional - for traceability)

**GET /api/os/lots**
```typescript
interface OSLot {
  id: string;
  lot_number: string;
  item_id: string;
  batch_id?: string;
  quantity: number;
  unit_of_measure: string;
  received_date: string;
  expiration_date?: string;
  status: 'available' | 'allocated' | 'expired' | 'quarantine';
  location_id: string;
}

Query Parameters:
- item_id?: string
- status?: string

Response: OSLot[]
```

---

## OPS Usage Patterns

### Pattern 1: Check Stock Before Creating Order

```typescript
// OPS: User creates order for "Hoppy Trail IPA" (50L Keg)
// Step 1: Get item from OS
const item = await fetch('/api/os/items?name=Hoppy Trail IPA');

// Step 2: Check on-hand quantity
const onHand = await fetch(`/api/os/inventory/on-hand/${item.id}`);

// Step 3: Display to user
if (onHand.total_quantity >= requestedQuantity) {
  // ✅ In stock - allow order
} else {
  // ❌ Out of stock - show warning
}
```

---

### Pattern 2: Display Product Catalog with Stock Status

```typescript
// OPS: Display products page
// Step 1: Get all finished goods from OS
const items = await fetch('/api/os/items?type=finished_good');

// Step 2: Get on-hand for each
const inventory = await fetch('/api/os/inventory/on-hand');

// Step 3: Merge and display
const productsWithStock = items.map(item => ({
  ...item,
  stock: inventory.find(inv => inv.item_id === item.id)?.quantity || 0,
  in_stock: inventory.find(inv => inv.item_id === item.id)?.quantity > 0
}));
```

---

### Pattern 3: Order Fulfillment - Allocate Inventory

```typescript
// OPS: Order approved, need to allocate inventory
// Step 1: Create order in OPS database
const order = await db.insert(orders).values({...});

// Step 2: For each line item, record movement in OS
for (const lineItem of order.lineItems) {
  await fetch('/api/os/inventory/movements', {
    method: 'POST',
    body: JSON.stringify({
      item_id: lineItem.product_id,
      from_location_id: 'WAREHOUSE-01',
      to_location_id: 'SHIPPING',
      quantity: lineItem.quantity,
      movement_type: 'shipment',
      reference_type: 'order',
      reference_id: order.id,
      performed_by: currentUser.id
    })
  });
}
```

---

### Pattern 4: Batch Tracking for Orders

```typescript
// OPS: Show which batch an order came from
// Step 1: Get order line items
const lineItems = await db.query.orderLineItems.findMany({
  where: eq(orderLineItems.order_id, orderId)
});

// Step 2: For each line item, get batch info from OS
for (const lineItem of lineItems) {
  const batches = await fetch(`/api/os/batches?item_id=${lineItem.product_id}`);
  // Display batch number, brew date, best by date
}
```

---

## Data Flow Examples

### Example 1: New Order Creation

```
User Action: Create order for 2 kegs of IPA

OPS Flow:
1. User selects "Hoppy Trail IPA" from dropdown
2. OPS calls OS: GET /api/os/items?name=Hoppy Trail IPA
3. OPS calls OS: GET /api/os/inventory/on-hand/{item_id}
4. OPS displays: "In Stock: 10 kegs" (green) or "Out of Stock" (gray)
5. User enters quantity: 2
6. OPS creates order in OPS database
7. OPS does NOT decrement inventory (OS owns that)
```

---

### Example 2: Order Approval & Fulfillment

```
User Action: Approve order

OPS Flow:
1. Update order status in OPS: draft → approved
2. For each line item:
   a. Call OS: POST /api/os/inventory/movements
      {
        item_id: "PROD-001",
        from_location_id: "WAREHOUSE",
        to_location_id: "SHIPPING",
        quantity: 2,
        movement_type: "shipment",
        reference_type: "order",
        reference_id: "ORD-001"
      }
3. OS decrements warehouse inventory
4. OS increments shipping inventory
5. OPS displays updated order status
```

---

### Example 3: Production Complete → Available for Sale

```
OS Flow:
1. Brewer completes batch in OS
2. OS creates batch record
3. OS creates inventory movement:
   {
     item_id: "PROD-001",
     to_location_id: "WAREHOUSE",
     quantity: 20,
     movement_type: "production",
     reference_type: "batch",
     reference_id: "BATCH-2025-001"
   }
4. OS increments warehouse inventory

OPS Flow:
1. OPS periodically refreshes inventory from OS
2. Product page now shows "In Stock: 20 kegs"
3. Orders can now be created for this product
```

---

## Integration Checklist

### Phase 1: Read-Only Integration
- [ ] OS provides GET endpoints for items, inventory, batches
- [ ] OPS reads from OS API to display stock levels
- [ ] OPS shows "In Stock" / "Out of Stock" based on OS data
- [ ] No inventory duplication in OPS database

### Phase 2: Write Integration (Movements)
- [ ] OS provides POST /api/os/inventory/movements
- [ ] OPS calls OS when orders are fulfilled
- [ ] OS decrements inventory when shipments occur
- [ ] Audit trail maintained in OS

### Phase 3: Advanced Features
- [ ] Lot tracking for traceability
- [ ] Batch-to-order linking
- [ ] Expiration date warnings
- [ ] Automated reorder points

---

## Key Rules

1. **OPS NEVER stores physical quantities**
   - ❌ `inventory.quantity_on_hand` in OPS database
   - ✅ `fetch('/api/os/inventory/on-hand')` from OS

2. **OS is the single source of truth**
   - All inventory movements recorded in OS
   - OPS reads, never writes quantities directly

3. **OPS adds business context**
   - Pricing (wholesale, retail, taproom)
   - Customer relationships
   - Order management
   - Invoicing
   - Vendor management

4. **Clean separation**
   - OS can run standalone (production control)
   - OPS is optional add-on (business layer)
   - No circular dependencies

---

## Next Steps

1. **Define OS API** (in OS project with ChatGPT)
   - Implement endpoints listed above
   - Test with sample data
   - Document response formats

2. **Build OPS Integration** (in OPS project with Airo)
   - Create OS API client library
   - Update product pages to read from OS
   - Add stock status indicators
   - Build order fulfillment workflow

3. **Test Integration**
   - Create order in OPS
   - Verify stock check calls OS
   - Approve order
   - Verify movement recorded in OS
   - Check inventory decremented in OS

---

## Questions to Answer

1. **Authentication**: How does OPS authenticate with OS API?
   - API key?
   - JWT token?
   - Shared secret?

2. **Error Handling**: What happens if OS is unavailable?
   - Cache last known inventory?
   - Show "Unable to check stock" message?
   - Queue movements for later?

3. **Real-time Updates**: How does OPS know when inventory changes?
   - Polling (every 30 seconds)?
   - Webhooks (OS pushes updates)?
   - WebSocket (real-time)?

4. **Multi-tenant**: How to handle multiple breweries?
   - Tenant ID in API calls?
   - Separate OS instances?
   - Shared OS with tenant isolation?

---

## Summary

**OS Responsibilities:**
- Physical inventory truth
- Batch production tracking
- Material consumption
- Location management
- Inventory movements audit trail

**OPS Responsibilities:**
- Customer relationships
- Order management
- Pricing & invoicing
- Vendor management
- Business reporting
- Reading inventory from OS API

**Integration:**
- OPS reads inventory from OS (never duplicates)
- OPS records movements in OS (shipments, adjustments)
- Clean API contract prevents data drift
- Each module can be developed independently
