# Canvas Keg Tracking System - Design Specification

## Overview

This document defines the design decisions and requirements for the BevForge Canvas-based Keg Tracking System. This system provides a visual, spatial interface for managing containers (kegs, cases, pallets) across locations with drag-and-drop interactions.

---

## Core Design Principles

### 1. Canvas = Icon View, Detail = List View
- **Canvas (spatial):** Visual representation of containers and locations
- **Detail Panel (data):** List-based view for editing and detailed information
- Only "break down" action converts list → icons on canvas

### 2. Breakdown = Ungrouping with Real Outcomes
- "Break down" is a physical operation, not just a UI change
- Triggers actual inventory movements
- Returns contents to canvas as individual icons

### 3. Compliance is Calculated, Not Displayed
- UI shows logistics (pallets, cases, kegs)
- Backend calculates volume for TTB reporting
- TTB tracks volume leaving bonded premises only (delivery trigger)
- Reporting decomposes containers automatically
- **"OPS does the math — UI just shows relationships"**

### 4. Real-World Flexibility
- Mixed pallets, partial pallets, loose units = all valid
- System adapts to operational reality
- Warnings, not hard blocks

---

## Gap #1: Scale Problem - RESOLVED

### Problem Statement
How to handle hundreds/thousands of containers without overwhelming the canvas?

### Solution: Hierarchical Container Grouping

#### Container Hierarchy
```
Individual Units (kegs, bottles, cans)
    ↓
Consumer Packages (6-pack, case)
    ↓
Distribution Units (pallet)
    ↓
Location
```

---

## Design Decisions

### Q1: Grouping Logic
**DECISION:** Manual Grouping (Option B)

**Rules:**
- Operator explicitly creates pallets
- Operator drags containers onto pallets
- No automatic grouping
- Matches physical palletizing operations

**Rationale:**
- Palletizing is a real physical operation
- Operator needs explicit control
- Matches drag-to-create mental model

---

### Q2: Pallet Capacity Rules
**DECISION:** Soft capacity rules, product-aware

**Rules:**
- Pallet type defines nominal capacity
- Capacity is advisory, not hard-blocking
- Overfill allowed with warning
- Examples:
  - ½ bbl keg pallet: nominal 6
  - 1/6 bbl keg pallet: nominal N (TBD)
  - Case pallets: nominal by case type

**UI Requirement (WHAT-only):**
Pallet must expose:
- Current count
- Nominal capacity
- Over/under state

**Visual Examples:**
- Normal: "6/6" (green/neutral)
- Under: "4/6" (yellow/amber)
- Over: "8/6" (orange warning)

---

### Q3: Partial Pallets
**DECISION:** Partial pallets allowed

**Rules:**
- Real-world flexibility: 6 kegs on pallet + 1 loose keg on truck = valid
- Partial pallets stay on canvas
- Operator decides when to palletize vs keep loose

**Visual Indicators:**
- Show ratio: "7/6" or "10/56"
- Different color/pattern for partial
- Warning indicator for over-capacity

**Examples:**
- Partial under: "23/56" with amber indicator
- Overfilled: "58/56" with orange warning
- Mixed partial: "MIX 47 units" with multi-color badge

---

### Q4: Mixed Pallets
**DECISION:** Mixed pallets allowed

**Rules:**
- Pallets can contain multiple products
- Pallets can contain multiple container types
- Real operations require this flexibility

**Visual Representation:**
- Multi-color icon or "mixed" badge
- Total unit count displayed
- **Detail view shows breakdown by product (list view)**

**Key Interaction:**
- Click pallet → **list view** (not icon-within-icon)
- List shows each container type with quantities
- Only "break down" action returns to icon view on canvas

**Example:**
```
Pallet P-001 (Mixed)
├─ 🛢️ Keg x20 (Dry Cider)
├─ 📦 Case x15 (Sweet Cider, 24-pack)
└─ 🍾 Bottle x12 (Rosé Cider)
```

---

### Q5: Pallet Identity & Tracking
**DECISION:** Pallet as Container (Option A)

**Rules:**
- Pallets have unique IDs (P-001, P-002, etc.)
- Pallets have barcodes/labels
- Track pallet movement (not just contents)
- Pallets can be created and deleted

**Use Cases:**
- Returnable pallets
- Pallet deposits
- Pallet-level compliance events
- Asset tracking

**Lifecycle:**
- Created by operator
- Loaded with containers
- Moved between locations
- Emptied (breakdown or delivery)
- Returned or disposed

---

### Q6: Unpacking/Breaking Down
**DECISION:** Driver-only breakdown with inventory return

**Rules:**
- **Only drivers break down pallets** (during delivery)
- Customers never break down pallets
- Returns go back to inventory (not treated as returns unless pre-paid - rare case)
- Partial pallets stay on canvas
- "Unpack/return to inventory" action available

**Workflow:**
1. Click pallet → expand view (list of contents)
2. Select items to deliver/remove
3. Pallet updates count automatically
4. Empty pallet (0 units):
   - **Returnable:** Stays as "empty pallet" on canvas
   - **Disposable:** Auto-removes from canvas

**Return to Inventory:**
- Driver returns with unused product
- "Return to Inventory" action moves contents back to warehouse
- Pallet removed from truck
- Contents available for re-allocation

---

### Q7: Visual Representation
**DECISION:** No icon-within-icon, quantity-based display

**Rules:**
- **No nested icons** (no tiny icons inside pallet icon)
- Pallet shows container types with quantities
- Case shows quantity, not individual units
- 6-pack is the visual unit for cans

**Examples:**
- Pallet: "🏗️ 🛢️ 47 kegs" (not 47 tiny keg icons)
- Case: "📦 🍾 24" (not 24 tiny bottle icons)
- 6-pack: "📦 🥫 6" (single 6-pack icon)

**Pallet Icon States:**

```
Full Pallet:
┌─────────┐
│  🏗️ 47  │  ← Solid border, count only
│  Kegs   │
└─────────┘

Partial Pallet (under capacity):
┌─────────┐
│  🏗️ 23  │  ← Yellow/amber indicator
│ ⚠️ 23/56 │    Shows ratio
└─────────┘

Overfilled Pallet:
┌─────────┐
│  🏗️ 58  │  ← Orange indicator
│ ⚠️ 58/56 │    Over nominal capacity
└─────────┘

Mixed Pallet:
┌─────────┐
│  🏗️ MIX │  ← Multi-color or badge
│ 47 units│     Total count
└─────────┘

In-Transit:
┌─────────┐
│  🏗️→ 47 │  ← Motion indicator
│  Kegs   │
└─────────┘

Overdue Return:
┌─────────┐
│  🏗️ 47  │  ← Red border
│ 🔴 Kegs  │     Alert badge
└─────────┘
```

---

### Q8: Case-Level Tracking
**DECISION:** Full case-level traceability

**Rules:**
- Cases have unique IDs (C-001, C-002, etc.)
- Case labels include: barcode, product, batch, date
- Track at case level when broken from pallet
- Aggregate to pallet level for full pallet movements

**Use Cases:**
- Traceability (batch recall)
- Partial deliveries
- Returns and credits
- Inventory accuracy

**Hierarchy:**
```
Pallet P-001
  ├─ Case C-001 (24x 12oz Dry Cider, Batch B-123)
  ├─ Case C-002 (24x 12oz Dry Cider, Batch B-123)
  └─ Case C-003 (24x 12oz Sweet Cider, Batch B-124)
```

---

### Q9: 6-Pack Constraint (Cans)
**DECISION:** 6-pack as minimum unit, mixed allowed

**Rules:**
- Cans sold as 6-packs (minimum unit from cidery)
- Individual cans at retail = not cidery's concern (future webstore/taproom)
- Mixed 6-packs allowed: "2x2x2" different products
- Product identifier for mixed: "X-mixed"
- Taproom treated as bar/restaurant (delivery and tracking rules apply)

**Examples:**
- Standard 6-pack: "Dry Cider 6-pack"
- Mixed 6-pack: "Variety-mixed" (2x Dry, 2x Sweet, 2x Rosé)

**Validation:**
- Cannot create individual can on canvas
- Orders must be in multiples of 6
- Production creates 6-packs (not individual cans)
- Exception: damaged 6-pack tracked as "broken pack"

---

### Q10: TTB Compliance Integration
**DECISION:** Volume calculated at reporting time, not displayed in UI

**Rules:**
- TTB tracks **volume leaving bonded premises only**
- Trigger = delivery leaves for customer (out for delivery)
- TTB doesn't care about pallets, cases, or packaging
- System decomposes containers to volume automatically during reporting

**Resolution:**
- Pallet/container movement = logistics (UI concern)
- Compliance resolves volume at child container level (backend concern)
- Mixed pallets decomposed automatically during reporting
- **"OPS does the math — UI just shows relationships"**

**Example:**
- UI shows: "Pallet P-001 with 47 kegs delivered to Restaurant A"
- Backend calculates: "23.5 bbls removed from bonded premises"
- TTB report: "23.5 bbls, Dry Cider, Restaurant A, Date"

---

## Canvas Interaction Model

### Create Pallet
1. Click "New Pallet" button
2. Select pallet type (keg, case, custom)
3. Empty pallet appears on canvas at current location
4. Drag containers onto pallet
5. Pallet updates count (with capacity warning if over)

### View Pallet Contents
1. Click pallet icon on canvas
2. **Detail panel opens (list view, not icon view)**
3. Shows:
   - Pallet ID
   - Contents breakdown (by container type and product)
   - Capacity status (X/Y with indicator)
   - Location
   - Associated delivery (if any)
4. Available actions: Edit, Print Label, Break Down, Delete, Return to Inventory

### Break Down Pallet
1. Click "Break Down" in detail panel
2. Confirmation: "This will unpack all contents to canvas"
3. Pallet contents appear as **individual icons on canvas** at current location
4. Empty pallet:
   - **Returnable:** Stays on canvas as "empty pallet"
   - **Disposable:** Auto-removes from canvas

### Load Delivery
1. Drag pallet from warehouse to truck on canvas
2. System prompts: "Associate with delivery?"
3. Select delivery or create new
4. Truck location shows pallet icon
5. Detail panel shows delivery info and route

### Partial Delivery
1. Driver at customer location
2. Opens pallet detail (list view)
3. Selects items to deliver (checkboxes)
4. Clicks "Deliver Selected"
5. Selected items move to customer location on canvas
6. Pallet updates to partial (remaining items)
7. Truck continues to next stop with partial pallet

### Return to Inventory
1. Driver returns with partial pallet or unused product
2. Opens pallet detail
3. Clicks "Return to Inventory"
4. System moves contents back to warehouse location
5. Pallet removed from truck
6. Contents available for re-allocation

---

## Detail Panel (List View) Specification

### Pallet Detail Panel

```
┌────────────────────────────────┐
│ Pallet P-001          [Edit] [×]│
├────────────────────────────────┤
│ Status: Partial (47/56)        │
│ Location: Truck #3             │
│ Delivery: DEL-123              │
│ Route: Stop 2 of 4             │
├────────────────────────────────┤
│ Contents:                      │
│ ☑ 🛢️ Keg K-001 | Dry Cider     │
│   Batch: B-123 | Filled: 1/15  │
│ ☑ 🛢️ Keg K-002 | Dry Cider     │
│   Batch: B-123 | Filled: 1/15  │
│ ☑ 📦 Case C-001 | Sweet (24)   │
│   Batch: B-124 | Packed: 1/20  │
│ ☑ 📦 Case C-002 | Sweet (24)   │
│   Batch: B-124 | Packed: 1/20  │
│ ... (43 more items)            │
├────────────────────────────────┤
│ [Break Down] [Print Label]     │
│ [Return to Inventory]          │
│ [Deliver Selected]             │
└────────────────────────────────┘
```

### Case Detail Panel

```
┌────────────────────────────────┐
│ Case C-001            [Edit] [×]│
├────────────────────────────────┤
│ Product: Sweet Cider           │
│ Package: 24x 12oz bottles      │
│ Batch: B-124                   │
│ Packed: 1/20/2025              │
│ Location: Pallet P-001         │
├────────────────────────────────┤
│ Traceability:                  │
│ Tank: T-003                    │
│ Bottling Run: BR-045           │
│ Expiration: 1/20/2026          │
├────────────────────────────────┤
│ [Print Label] [View Batch]     │
│ [Remove from Pallet]           │
└────────────────────────────────┘
```

### Keg Detail Panel

```
┌────────────────────────────────┐
│ Keg K-001             [Edit] [×]│
├────────────────────────────────┤
│ Product: Dry Cider             │
│ Size: 1/2 bbl (15.5 gal)       │
│ Batch: B-123                   │
│ Filled: 1/15/2025              │
│ Status: At Customer            │
│ Location: Restaurant A         │
│ Days Out: 14                   │
├────────────────────────────────┤
│ Movement History:              │
│ 1/15 - Filled (Tank T-001)     │
│ 1/16 - Loaded (Truck #3)       │
│ 1/16 - Delivered (Restaurant A)│
├────────────────────────────────┤
│ Financial:                     │
│ Deposit: $30.00 (Outstanding)  │
│ Expected Return: 2/15/2025     │
├────────────────────────────────┤
│ [Mark Returned] [Print Label]  │
│ [View Batch] [Movement History]│
└────────────────────────────────┘
```

---

## Product-Specific Packaging Rules

### Kegs
- **Individual units:** Tracked individually with unique IDs
- **Pallet capacity:** 
  - 1/2 bbl: ~6 per pallet
  - 1/6 bbl: ~TBD per pallet
- **Mixed pallets:** Allowed (different sizes, different products)
- **Loose units:** Allowed (kegs can exist outside pallets)

### Bottles
- **Sold as:** Individual OR by case
- **Case size:** Variable (12-pack, 24-pack, etc.)
- **Pallet capacity:** ~56 cases (standard, varies by case size)
- **Mixed pallets:** Allowed (different products, different case sizes)

### Cans
- **Minimum unit:** 6-pack (cannot create individual can)
- **Case size:** 4x 6-packs = 24-pack case
- **Pallet capacity:** Variable by case type
- **Mixed 6-packs:** Allowed (2x2x2 different products, labeled "X-mixed")
- **Visual unit:** 6-pack icon (not individual cans)

---

## Location Types & Behaviors

### Warehouse
- **Purpose:** Inventory pool, storage
- **Allowed actions:** Create containers, create pallets, load deliveries
- **Visual:** Large zone, can hold many pallets/containers
- **Zones:** May have sub-zones (production, finished goods, returns, cleaning)

### Delivery Truck
- **Purpose:** In-transit containers
- **Allowed actions:** Load, unload, partial delivery
- **Visual:** Shows route, current stop, contents
- **Detail panel:** Route list, delivery schedule

### Customer Location (Restaurant, Bar, Venue)
- **Purpose:** Deployed inventory
- **Allowed actions:** Deliver, return, track overdue
- **Visual:** Shows current inventory, overdue alerts
- **Detail panel:** Customer info, order history, outstanding deposits

### Production Floor
- **Purpose:** Filling, packaging operations
- **Allowed actions:** Fill kegs, pack cases, create 6-packs
- **Visual:** Shows active production runs
- **Detail panel:** Batch info, production schedule

### Cleaning Station
- **Purpose:** Keg maintenance, sanitation
- **Allowed actions:** Move kegs to/from cleaning, track cleaning cycles
- **Visual:** Shows kegs in cleaning queue
- **Detail panel:** Cleaning schedule, inspection status

---

## Printing & Labeling

### Keg Labels
- **Trigger:** Right-click keg → Print Label OR from detail panel
- **Contents:**
  - Keg ID (barcode)
  - Product name
  - Batch number
  - Fill date
  - Expiration date (if applicable)

### Case Labels
- **Trigger:** Right-click case → Print Label OR from detail panel
- **Contents:**
  - Case ID (barcode)
  - Product name
  - Package size (24x 12oz)
  - Batch number
  - Pack date
  - Expiration date

### Pallet Labels
- **Trigger:** Right-click pallet → Print Label OR from detail panel
- **Contents:**
  - Pallet ID (barcode)
  - Contents summary (mixed or single product)
  - Total units
  - Destination (if associated with delivery)
  - Date

### Delivery Invoice
- **Trigger:** Drag pallet to truck → auto-generate OR from delivery detail
- **Contents:**
  - Delivery ID
  - Customer info
  - Route and stops
  - Itemized list (pallets, cases, kegs)
  - Quantities and products
  - Deposit amounts
  - Total value

---

## Alerts & Risk Indicators

### Container-Level Alerts
- **Overdue return:** Red border, days overdue badge
- **Needs maintenance:** Yellow border, wrench icon
- **Damaged:** Red X badge
- **Low inventory:** Amber alert on location

### Pallet-Level Alerts
- **Over-capacity:** Orange warning (58/56)
- **Under-capacity:** Amber indicator (23/56)
- **Mixed contents:** Multi-color badge
- **In-transit:** Motion indicator

### Location-Level Alerts
- **Customer overdue returns:** Red badge with count
- **Low available inventory:** Amber alert
- **Deposit imbalance:** Yellow warning

---

## Success Criteria (from OPS-UI-CONTRACT)

An implementation is valid if an operator can:

1. **Understand current operational state in under 60 seconds**
   - Canvas provides spatial overview
   - Alerts visible at glance
   - Detail panels provide context

2. **Take required action in under three interactions**
   - Drag-drop for movements
   - Click for details
   - Context actions in panels

3. **Trace any physical movement end-to-end**
   - Container movement history
   - Location chain visible
   - Product/batch traceability

4. **Identify compliance risk before it becomes a violation**
   - TTB trigger visibility (delivery out for delivery)
   - Overdue alerts
   - Inventory discrepancies surfaced

---

## Gap #2: Bulk Operations

### Problem Statement
Loading 30 kegs onto a truck one-by-one is tedious. How do you handle bulk operations efficiently?

### Solution: Product-Centric Representation

**Key Principle:**
> "We're not moving kegs as much as product. Kegs are just trackable containers for the product everyone cares about."

**Canvas shows PRODUCTS, not individual containers:**
- Visual: "🛢️ Hopped Cider (4 kegs)" not "Keg #1, Keg #2, Keg #3, Keg #4"
- Reduces visual clutter (4 products vs 40 individual kegs)
- Matches how people think ("I need Hopped Cider" not "I need Keg K-1234")
- Simplifies compliance (TTB cares about product/volume, not keg IDs)
- Makes canvas scalable (100 kegs = maybe 10 product types)

### Quantity Editing in Detail Panels

**Canvas View (collapsed):**
```
┌─────────────┐
│  🏗️ Pallet  │
│  4 products │
└─────────────┘
```

**Detail Panel (expanded with editable quantities):**
```
┌──────────────────────────────┐
│ Pallet P-001                 │
├──────────────────────────────┤
│ 🛢️ Hopped Cider    [4] kegs │  ← Editable quantity
│ 🛢️ Aged Cider      [2] kegs │
│ 📦 Dry Cider       [3] cases│
│ 📦 Sweet Cider     [1] case │
└──────────────────────────────┘
```

**Benefits:**
- Bulk operations (change 4 → 10 kegs without dragging)
- Quick adjustments (customer changed order)
- Inventory corrections (found 2 more kegs)

### Product Representation on Canvas

**Warehouse Location:**
```
┌────────────────────────────────┐
│ 🛢️ Hopped (4)  🛢️ Aged (2)    │  ← Product groups
│ 📦 Dry (3)     📦 Sweet (1)    │     with quantities
└────────────────────────────────┘
```

**Truck #3:**
```
┌────────────────────────────────┐
│ 🏗️ 2 pallets                   │  ← Collapsed view
│ 🛢️ Hopped (4)  📦 Dry (3)      │  ← Loose items
└────────────────────────────────┘
```

**Each product group shows:**
- Product type (icon + name)
- Container format (keg vs case)
- Quantity (number)

### QR Code Tracking System

**Technology Choice: QR Codes**
- Easy to generate
- Easy to scan with smartphone camera
- Higher data capacity than barcodes
- Error correction (works even if partially damaged)

**QR Code Contents:**
- Product name/ID
- Batch number
- Fill date
- Container ID (keg/case number)
- Expiration date

**Best Practices:**
- Print large enough for easy scanning (2"x2" minimum)
- Include human-readable text below QR (for visual verification)
- Use ruggedized phone cases for warehouse use
- Ensure adequate lighting in scanning areas

**Scanning Workflow:**
1. Warehouse worker scans QR codes during loading
2. System confirms each scan matches delivery
3. Highlights discrepancies (wrong product, extra items)
4. Operator corrects before truck leaves

**Potential Drawbacks:**
- Requires good lighting (warehouse may be dim)
- Requires camera focus (may be slower than laser scanner)
- Phone battery drain (if scanning all day)

### Truck Capacity Constraints

**Each truck has defined capacity by fleet number:**
- Example: Truck #3 can hold 1 pallet and 3 cases
- System enforces capacity limits
- If order exceeds capacity, triggers second delivery

**Visual Feedback:**

**Truck #3 (loading):**
```
┌────────────────────────────────┐
│ Capacity: 1 pallet, 3 cases    │
│ Current:  1 pallet, 2 cases    │
│ ✅ Space available: 1 case     │
└────────────────────────────────┘
```

**Truck #3 (at capacity):**
```
┌────────────────────────────────┐
│ Capacity: 1 pallet, 3 cases    │
│ Current:  1 pallet, 3 cases    │
│ ⚠️ At capacity - no more room  │
└────────────────────────────────┘
```

**Truck #3 (over capacity):**
```
┌────────────────────────────────┐
│ Capacity: 1 pallet, 3 cases    │
│ Current:  1 pallet, 4 cases    │
│ 🔴 Over capacity by 1 case!    │
└────────────────────────────────┘
```

**System Triggers:**
- Warning when approaching capacity
- Error if trying to exceed capacity
- Auto-suggest second delivery if order too large
- Route optimization (which truck for which orders)

### Multiple Pallet Handling

**Canvas View (collapsed count):**
```
┌────────────────────────────────┐
│ Truck #3                       │
│ 🏗️ 2 pallets                   │  ← Collapsed count
│ 🛢️ Hopped (4)  📦 Dry (3)      │  ← Loose items
└────────────────────────────────┘
```

**Detail Panel (click truck):**
```
┌────────────────────────────────┐
│ Truck #3 - Route A             │
├────────────────────────────────┤
│ Pallets:                       │
│ 🏗️ P-001 → Restaurant A        │
│    └─ 🛢️ Hopped (20 kegs)     │
│ 🏗️ P-002 → Bar B               │
│    └─ 📦 Dry (56 cases)        │
│ 🏗️ P-003 → Venue C             │
│    └─ 🛢️ Aged (15 kegs)        │
│                                │
│ Loose Items:                   │
│ 🛢️ Hopped (2 kegs) → Rest. A  │
│ 📦 Dry (5 cases) → Bar B       │
└────────────────────────────────┘
```

**Benefits:**
- Visual clutter reduced (3 pallets = 1 icon with count)
- Destination tracking (each pallet has destination)
- Route visibility (see full truck manifest)
- No need to group pallets (they're already grouped containers)

### Cleaning Queue Workflow

**Principle:**
> "Returned kegs automatically go to warehouse for cleaning. Register they were picked up, trigger cleaning task."

**Canvas View (minimal clutter):**
```
┌────────────────────────────────┐
│ Warehouse                      │
│ 🧼 Cleaning (47 kegs)          │  ← Single icon with count
└────────────────────────────────┘
```

**Detail Panel (click cleaning icon):**
```
┌────────────────────────────────┐
│ Cleaning Queue                 │
├────────────────────────────────┤
│ 🛢️ Hopped (12 kegs)            │
│    Returned: 2024-12-19        │
│    From: Restaurant A, Bar B   │
│                                │
│ 🛢️ Aged (8 kegs)               │
│    Returned: 2024-12-19        │
│    From: Venue C               │
│                                │
│ [Start Cleaning] [View Tasks]  │
└────────────────────────────────┘
```

**Return Workflow:**
1. Driver scans returned kegs at customer (marks as "returned")
2. System updates location: customer → in-transit
3. Driver returns to warehouse
4. Scans kegs again (confirms physical return)
5. System auto-moves to cleaning queue
6. Cleaning task auto-created on calendar
7. Canvas shows "🧼 Cleaning (47)" with updated count
8. Operator clicks to see details/start cleaning
9. After cleaning, kegs move to "Empty Kegs Available" pool

**Benefits:**
- Automatic (low effort)
- Visible (can see backlog)
- Not cluttered (single icon)
- Trackable (know which kegs from which customers)
- Task integration (calendar reminder)

**Note:** We don't track empty keg movement in detail on UI. Focus is on registration of pickup/return and triggering cleaning tasks.

### Bulk Operations via Product Quantities

**Primary Method: Product-Level Editing**
- Canvas shows products (not individual containers)
- Edit quantities in detail panel
- System tracks individual containers behind the scenes

**Loading Workflow:**
1. Create delivery for Order #123
2. System calculates required products
3. Operator opens truck detail panel
4. Adds products with quantities:
   - "Hopped Cider: 20 kegs"
   - "Dry Cider: 15 cases"
5. System validates against truck capacity
6. If over capacity, suggests second delivery
7. Operator confirms
8. System allocates specific containers (FIFO)
9. Canvas updates (products appear on truck)

**Inventory Validation:**
- Order creation checks real-time inventory
- Can't order 20 kegs if only 15 available
- Quantity selector limited to available stock
- If shortage happens (inventory error), alert workflow triggers
- Driver manager contacts customer for substitutions

**Validation Workflow:**
1. Warehouse worker scans QR codes as loading
2. System confirms each scan matches delivery
3. Highlights discrepancies (wrong product, extra items)
4. Operator corrects before truck leaves

**Behind the Scenes:**
- System maintains individual container IDs
- FIFO allocation (oldest kegs shipped first)
- Traceability maintained (which specific kegs in which delivery)
- Compliance reporting uses individual container data
- UI shows aggregated product view for simplicity

---

## Gap #3: Time Dimension

### Solution: Leverage Existing Systems

**Key Principle:**
> Canvas shows current operational state only. Time management handled by existing infrastructure.

**Existing Systems Handle Time:**
- ✅ **Calendar** - Scheduling, tasks, events
- ✅ **Invoicing** - Transaction history, customer signatures
- ✅ **Inventory** - Stock levels, availability
- ✅ **Notifications** - Alerts, approvals, status updates

**Canvas Role:**
- Shows "what's where right now"
- Operational staging/execution layer
- NOT a historical viewer or planning tool

**Integration Points:**
- Order created → Calendar shows scheduled delivery
- Delivery executed → Invoice signed and closed
- Keg returned → Cleaning task created in Calendar
- Overdue return → Notification alert sent

---

## Gap #6: Printing & Documentation

### Print Requirements

**Printing Method:**
- Browser print dialog (standard approach)
- System printer drivers handle printer-specific formatting
- PDF generation option (save/download before printing)

**Print Button Locations:**

#### Container Labels
```
Container Detail Panel:
┌────────────────────────────────┐
│ Keg K-1234 - Hopped Cider     │
│ Batch: B-2024-12-15            │
│ Filled: Dec 15, 2024           │
│                                │
│ [🖨️ Print Label] [💾 Save PDF]│
└────────────────────────────────┘
```

**What Gets Printed:**

1. **Keg Labels (QR Codes)**
   - Keg ID
   - Product name
   - Batch number
   - Fill date
   - QR code (scannable)
   - Human-readable backup text

2. **Case Labels (QR Codes)**
   - Case ID
   - Product name
   - Quantity (e.g., "24x 12oz bottles")
   - Batch number
   - Pack date
   - QR code

3. **Pallet Labels**
   - Pallet ID
   - Contents summary
   - Destination
   - Total weight/count
   - QR code

4. **Delivery Invoices**
   - Customer info
   - Order details
   - Product list with quantities
   - Delivery address
   - Signature line
   - Terms/payment info

5. **Delivery Manifests/BOL**
   - Truck number
   - Route details
   - All stops with products
   - Driver name
   - Departure/return times

6. **Pick Lists**
   - Products to load
   - Quantities
   - Warehouse locations
   - Checkboxes for verification

**Print Locations by Page:**

**Orders Page:**
- [🖨️ Print Pick List] - Warehouse picking
- [🖨️ Print Invoice] - Customer invoice
- [💾 Save as PDF] - Download option

**Deliveries Page:**
- [🖨️ Print Manifest] - Driver manifest/BOL
- [🖨️ Print All Invoices] - All customer invoices for route
- [💾 Save as PDF] - Download option

**Invoicing Page:**
- [🖨️ Print Invoice] - Customer copy
- [📧 Email Invoice] - Send via email
- [💾 Save as PDF] - Download option

**Inventory/Products Page:**
- [🖨️ Print Labels (Batch)] - Print multiple labels at once
- [💾 Save as PDF] - Download option

**Canvas Container Details:**
- [🖨️ Print Label] - Individual container label
- [💾 Save as PDF] - Download option

**QR Code Specifications:**
- **Encoding format:** URL format `https://bevforge.app/container/{type}/{id}`
  - Example: `https://bevforge.app/container/keg/K-1234`
- **Size:** Minimum 1.5" x 1.5" for reliable scanning
- **Error correction:** Level M (15% recovery)
- **Include human-readable text** below QR code

**Label Sizes (Standard):**
- Keg labels: 4" x 6"
- Case labels: 4" x 6"
- Pallet labels: 8" x 10"
- Invoices: 8.5" x 11" (standard letter)

**Batch Printing:**
- Select multiple containers → Print all labels
- Select multiple orders → Print all invoices
- Confirmation dialog shows count before printing

---

## Gap #7: Data Entry & Validation

### Validation Rules

**Inventory Validation:**
- ✅ Cannot allocate more than available
- ✅ Cannot create negative inventory
- ✅ Warn on low stock levels (< 10% of normal)
- ✅ Block orders if out of stock
- ✅ Real-time availability check during order creation

**Capacity Validation:**
- ✅ Warn when pallet approaching capacity (>90%)
- ✅ Error when truck at capacity (100%)
- ✅ Allow overfill with warning (up to 150%)
- ✅ Suggest second delivery if order exceeds truck capacity

**Date Validation:**
- ✅ Delivery date cannot be in past
- ✅ Fill date cannot be in future
- ✅ Expected return date must be after delivery date
- ✅ Warn if delivery scheduled > 30 days out

**Relationship Validation:**
- ✅ Customer must exist before creating order
- ✅ Product must exist before adding to order
- ✅ Truck must exist before loading
- ✅ Order must exist before creating delivery
- ✅ Batch must be active before filling containers

**Business Logic Validation:**
- ✅ Cannot deliver empty containers (must have product)
- ✅ Cannot return more than delivered
- ✅ Cannot delete container if in-transit or at-customer
- ✅ Cannot modify completed delivery
- ✅ Cannot fill keg that's already filled
- ✅ Cannot clean keg that's not empty

### Critical Data Points

**1. Container Creation**
```
Required Fields:
- Product (dropdown, must exist)
- Batch (dropdown, must be active)
- Quantity (number, min: 1, max: 1000)
- Fill Date (date, cannot be future)

Validation:
- Product must exist in system
- Batch must be active and have available volume
- Quantity must be positive integer
- Fill date <= today
- Sufficient inventory to create containers
```

**2. Order Creation**
```
Required Fields:
- Customer (dropdown, must exist)
- Delivery Date (date, >= today)
- Products (at least one)
  - Product (dropdown)
  - Quantity (number, min: 1)
  - Container Type (keg/case/bottle)

Validation:
- Customer must exist and be active
- Delivery date >= today
- At least one product line item
- Check inventory availability for each product
- Validate customer credit limit
- Warn if customer has overdue payments
```

**3. Delivery Loading**
```
Required Fields:
- Truck (dropdown, must exist)
- Driver (dropdown, must exist)
- Products (from orders)

Validation:
- Truck must exist and be available
- Driver must be assigned
- Products must match associated orders
- Inventory must be available
- Truck capacity check (warn/error)
- Route must be assigned
- Cannot load if truck already on route
```

**4. Pallet Creation**
```
Required Fields:
- Pallet Type (dropdown)

Validation:
- Pallet type must be selected
- Warn if contents exceed nominal capacity (>90%)
- Error if contents way over capacity (>150%)
- Track mixed vs single-product pallets
```

**5. Product/Quantity Editing**
```
Validation:
- Must be positive integer
- Check inventory availability
- Warn if exceeds capacity (pallet/truck)
- Confirm if major change (>50% increase/decrease)
- Cannot reduce below already-delivered quantity
```

**6. Customer Returns**
```
Required Fields:
- Customer (auto-filled from delivery)
- Quantity returned (number)
- Condition (clean/damaged)

Validation:
- Cannot return more than delivered to customer
- Condition must be selected for each container
- Track outstanding balance (delivered - returned)
- Update deposit balance
- Damaged containers flagged for inspection
```

**7. QR Code Scanning**
```
Validation:
- QR code must be valid format
- Container must exist in system
- Container state must allow action (e.g., can't deliver empty keg)
- Scan must match expected action context
- Duplicate scan detection (within 5 minutes)
```

### Error Handling

**User-Facing Errors:**
- Clear, actionable error messages
- Suggest corrections when possible
- Show which field has the error
- Prevent form submission until resolved

**Examples:**
```
❌ "Product is required"
✅ "Please select a product from the dropdown"

❌ "Invalid quantity"
✅ "Quantity must be at least 1. You entered 0."

❌ "Insufficient inventory"
✅ "Only 15 kegs of Hopped Cider available. You requested 20. Reduce quantity or choose different product."

❌ "Truck full"
✅ "Truck #3 can hold 1 pallet + 3 cases. Currently loaded: 1 pallet + 3 cases. Remove items or use different truck."
```

**Warnings (Non-Blocking):**
```
⚠️ "Pallet is over nominal capacity (58/56 cases). Continue anyway?"
⚠️ "Customer has overdue payment of $1,234. Proceed with order?"
⚠️ "Delivery scheduled 45 days out. Confirm date?"
⚠️ "Low inventory: Only 5 kegs remaining after this order."
```

---

## API Endpoints

### Delivery Integration (Gap #5)
```
POST   /api/deliveries              - Create delivery
GET    /api/deliveries/:id          - Get delivery details
PUT    /api/deliveries/:id          - Update delivery
POST   /api/deliveries/:id/complete - Mark complete
GET    /api/deliveries/scheduled    - Get scheduled deliveries
POST   /api/deliveries/:id/stop     - Complete delivery stop
```

### Printing (Gap #6)
```
POST   /api/print/keg-label         - Generate keg label (HTML/PDF)
POST   /api/print/case-label        - Generate case label (HTML/PDF)
POST   /api/print/pallet-label      - Generate pallet label (HTML/PDF)
POST   /api/print/invoice           - Generate invoice PDF
POST   /api/print/manifest          - Generate delivery manifest PDF
POST   /api/print/pick-list         - Generate pick list PDF
POST   /api/qr/generate             - Generate QR code image

Request body example:
{
  "containerId": "K-1234",
  "containerType": "keg",
  "format": "pdf" | "html"
}

Response:
{
  "url": "/api/print/download/abc123.pdf",
  "expires": "2024-12-20T10:00:00Z"
}
```

### Mobile/Connect Integration (Gap #8)
```
POST   /api/mobile/scan             - Record QR scan
GET    /api/mobile/deliveries       - Get driver deliveries
POST   /api/mobile/delivery/start   - Start delivery route
POST   /api/mobile/delivery/stop    - Complete delivery stop
POST   /api/mobile/return           - Record container return
GET    /api/mobile/sync             - Sync offline data
POST   /api/mobile/auth             - Mobile authentication

Scan request:
{
  "qrCode": "https://bevforge.app/container/keg/K-1234",
  "action": "load" | "deliver" | "return",
  "location": "Truck #3" | "Restaurant A",
  "timestamp": "2024-12-19T14:30:00Z"
}
```

### Container Management
```
POST   /api/containers              - Create container(s)
GET    /api/containers/:id          - Get container details
PUT    /api/containers/:id          - Update container
DELETE /api/containers/:id          - Delete container
GET    /api/containers              - List containers (with filters)
POST   /api/containers/batch        - Batch create containers
POST   /api/containers/:id/move     - Move container to location
```

### Pallet Management
```
POST   /api/pallets                 - Create pallet
GET    /api/pallets/:id             - Get pallet details
PUT    /api/pallets/:id             - Update pallet
DELETE /api/pallets/:id             - Delete pallet
POST   /api/pallets/:id/add         - Add containers to pallet
POST   /api/pallets/:id/remove      - Remove containers from pallet
POST   /api/pallets/:id/breakdown   - Break down pallet
```

### Validation
```
POST   /api/validate/order          - Validate order before creation
POST   /api/validate/inventory      - Check inventory availability
POST   /api/validate/capacity       - Check truck/pallet capacity
GET    /api/validate/customer/:id   - Check customer status
```

---

## Document Status

- **Version:** 3.0
- **Date:** 2024-12-19
- **Status:** All Gaps RESOLVED (Gap #1, #2, #3, #6, #7)
- **Deferred:** Gap #4 (webstore), Gap #5 (existing tools), Gap #8 (Connect suite)
- **Ready for:** Implementation
