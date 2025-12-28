# OPS-UI-CONTRACT.md
## BevForge OPS — UI Capability Contract

### 0. Authority & Intent
This document defines WHAT operator capabilities MUST exist in the OPS UI.
It intentionally does NOT define layout, placement, or visual design.
Any UI implementation is valid if all capabilities below are satisfied.

---

## 1. Core UX Principle (Anchor Rule)

OPS UI exists to keep the operator oriented, compliant, and in control during production, packaging, distribution, and sales operations.

The OPS UI MUST prioritize:
- Situational awareness
- Traceability
- Accountability
- Low cognitive load during real operational work

---

## 2. Mandatory Global Capabilities

These capabilities MUST be reachable from anywhere within OPS.

### 2.1 Core Action Initiation
The operator MUST be able to initiate:
- 2.1.a Create or modify an order
- 2.1.b Create or modify a delivery
- 2.1.c Record packaging / packing events
- 2.1.d Record inventory movement or adjustment
- 2.1.e Create and manage operational tasks

### 2.2 Global Context Access
The operator MUST be able to access:
- 2.2.a Inventory
- 2.2.b Orders
- 2.2.c Deliveries
- 2.2.d Directory (CRM)
- 2.2.e Compliance status

### 2.3 Alerts & Risks
The operator MUST be alerted to:
- 2.3.a Compliance deadlines
- 2.3.b Inventory discrepancies
- 2.3.c Overdue or incomplete deliveries
- 2.3.d Missing or overdue containers (e.g., kegs)
- 2.3.e Low keg inventory (available empties)
- 2.3.f Kegs requiring maintenance
- 2.3.g Customer deposit imbalances

---

## 3. Operational Awareness Capabilities

At any moment, the UI MUST allow the operator to answer:
- 3.1 What requires attention right now?
- 3.2 What is currently in motion?
- 3.3 What is at risk?
- 3.4 What has recently changed?

At minimum, the UI MUST surface:
- 3.5 Pending or overdue operational actions
- 3.6 In-progress deliveries or movements
- 3.7 Inventory in non-final or transitional states
- 3.8 Compliance-relevant timing and thresholds

---

## 4. Directory / CRM Capabilities

OPS UI MUST provide access to a directory of operational entities.

### 4.1 Directory Scope
The operator MUST be able to access:
- 4.1.a Customers
- 4.1.b Vendors
- 4.1.c Host facilities
- 4.1.d Event venues

### 4.2 Directory as Operational Launch Point
From any directory entity, the operator MUST be able to:
- 4.2.a View operational history
- 4.2.b Initiate orders
- 4.2.c Initiate deliveries
- 4.2.d View outstanding obligations:
  - 4.2.d.i Containers currently at customer location
  - 4.2.d.ii Overdue container returns
  - 4.2.d.iii Outstanding deposit balances
  - 4.2.d.iv Unpaid invoices

The directory MUST function as an operational control surface, not a static contact list.

---

## 5. Orders Capabilities

### 5.1 Order Management
The operator MUST be able to:
- 5.1.a Create and modify orders
- 5.1.b Associate orders with directory entities
- 5.1.c Track order status through fulfillment

### 5.2 Order Traceability
The operator MUST be able to navigate:
- 5.2.a From an order → to related deliveries
- 5.2.b From an order → to associated inventory

Orders MUST remain visibly connected to physical reality.

---

## 6. Deliveries Capabilities

Deliveries are first-class operational workflows.

### 6.1 Delivery Creation & Association
The operator MUST be able to:
- 6.1.a Create deliveries
- 6.1.b Associate one or more orders
- 6.1.c Associate inventory containers (kegs, cases, etc.)
- 6.1.d Record container-level details per delivery (which specific kegs, not just quantities)
- 6.1.e Track expected vs actual returns for reusable containers

### 6.2 Delivery State & History
The operator MUST be able to:
- 6.2.a View delivery state
- 6.2.b View delivery history
- 6.2.c Identify delivery exceptions

### 6.3 Delivery Traceability
Deliveries MUST be traceable:
- 6.3.a Back to inventory
- 6.3.b Back to directory entities
- 6.3.c Forward to compliance and revenue records

---

## 7. Inventory & Container Capabilities

Inventory MUST be explorable and traceable.

### 7.1 Inventory Visibility
The operator MUST be able to view inventory by:
- 7.1.a Location
- 7.1.b Legal status (bonded, unbonded, in-transit)
- 7.1.c Container type

### 7.2 Container-Level Tracking (Kegs, Reusables)
The operator MUST be able to:
- 7.2.a View individual containers
- 7.2.b View current location and custody
- 7.2.c View container movement history
- 7.2.d Identify overdue or missing containers
- 7.2.e Track keg lifecycle states (empty, filled, delivered, returned, cleaning)
- 7.2.f Track keg deposits and financial reconciliation
- 7.2.g Identify kegs requiring maintenance or inspection
- 7.2.h Support keg rotation strategies (FIFO/LIFO)

Container tracking MUST support asset accountability.

### 7.3 Container Returns & Reconciliation
The operator MUST be able to:
- 7.3.a Record container returns from customers
- 7.3.b Reconcile expected vs actual returns
- 7.3.c Track overdue returns by customer
- 7.3.d Process deposit refunds/credits
- 7.3.e Flag damaged or missing containers

---

## 8. Packaging & Production Visibility

The UI MUST support visibility into packaging and production-related events.

### 8.1 Packaging Events
The operator MUST be able to:
- 8.1.a Record packaging events (manual or automated)
- 8.1.b View packaging history
- 8.1.c See how packaging affected inventory

### 8.2 Volume Traceability
The operator MUST be able to trace:
- 8.2.a Finished goods → back to source tanks, barrels, or totes
- 8.2.b Volume movements between containers
- 8.2.c Keg fill events → back to source batch/tank
- 8.2.d Keg contents → forward to delivery and consumption

---

## 9. Compliance Capabilities

Compliance information MUST be surfaced proactively.

The operator MUST be able to:
- 9.1 View removal events
- 9.2 View tax-relevant activity
- 9.3 View reporting period status

Compliance risk MUST be visible before deadlines are missed.

---

## 10. Tasks & Accountability Capabilities

The operator MUST be able to:
- 10.1 View assigned tasks
- 10.2 Complete tasks
- 10.3 View task history

When approvals are required:
- 10.4 Approval state MUST be visible
- 10.5 Approval history MUST be traceable

Tasks MUST feel operationally connected, not generic.

---

## 11. Traceability & Navigation Guarantees

The UI MUST support bidirectional navigation between related concepts:
- 11.1 Inventory ↔ Deliveries
- 11.2 Deliveries ↔ Orders
- 11.3 Orders ↔ Directory entities
- 11.4 Packaging ↔ Inventory
- 11.5 Containers ↔ Movement history

No operational record may exist in isolation.

---

## 12. Visibility Guarantees

The UI MUST ensure:
- 12.1 Critical operational issues are discoverable without deep navigation
- 12.2 Compliance risk is visible to the operator
- 12.3 Inventory discrepancies are discoverable

---

## 13. UX Freedom Clause (Hard Guardrail)

UI implementations MAY choose:
- Any layout
- Any navigation pattern
- Any interaction model
- Any visual design system

UI implementations MAY NOT:
- Remove required capabilities
- Collapse distinct operational concepts
- Hide compliance-critical information
- Invent new business meaning

---

## 14. Success Test (Litmus)

An OPS UI implementation is valid if an operator can:
- 14.1 Understand current operational state in under 60 seconds
- 14.2 Take required action in under three interactions
- 14.3 Trace any physical movement end-to-end
- 14.4 Identify compliance risk before it becomes a violation

---

## 15. Financial Accountability

The operator MUST be able to:
- 15.1 Track container deposit balances by customer
- 15.2 Reconcile physical container counts with financial records
- 15.3 Identify deposit discrepancies
- 15.4 Generate deposit refund/credit documentation

---

## 16. Container Lifecycle Management (Kegs & Reusables)

This section defines comprehensive requirements for managing reusable containers (kegs, totes, barrels, etc.) throughout their operational lifecycle.

### 16.1 Container Pool Visibility
The operator MUST be able to view:
- 16.1.a Total container inventory (owned, leased, borrowed)
- 16.1.b Container availability by state:
  - Empty (available for filling)
  - Filled (ready for delivery)
  - In-transit (between locations)
  - At-customer (deployed)
  - Returned (awaiting processing)
  - Cleaning (in sanitation cycle)
  - Maintenance (requiring repair/inspection)
  - Condemned (removed from service)
- 16.1.c Container utilization metrics:
  - Turnover rate (fills per container per period)
  - Average time at customer
  - Average time in facility
  - Percentage deployed vs available

### 16.2 Container State Transitions
The operator MUST be able to record and track:
- 16.2.a Container fills:
  - Source batch/tank → specific keg
  - Fill date and time
  - Product and volume
  - Operator/equipment used
- 16.2.b Container deliveries:
  - Specific kegs → customer location
  - Delivery date and time
  - Associated order/invoice
  - Delivery personnel
- 16.2.c Container returns:
  - Customer location → facility
  - Return date and time
  - Condition assessment
  - Partial vs complete returns
- 16.2.d Container cleaning/maintenance:
  - Entry into cleaning cycle
  - Cleaning method and date
  - Inspection results
  - Return to available pool
- 16.2.e Container damage or loss:
  - Damage assessment and photos
  - Loss reporting and investigation
  - Insurance claims
  - Write-off procedures

### 16.3 Container Maintenance
The operator MUST be able to:
- 16.3.a Track cleaning cycles:
  - Last cleaned date
  - Cleaning method (CIP, manual, external)
  - Cleaning verification
  - Next cleaning due date
- 16.3.b Schedule and record inspections:
  - Visual inspection results
  - Pressure testing (if applicable)
  - Valve/fitting condition
  - Inspection frequency compliance
- 16.3.c Flag containers requiring maintenance:
  - Overdue for cleaning
  - Overdue for inspection
  - Reported damage
  - Performance issues
- 16.3.d Track repair history:
  - Repair date and description
  - Parts replaced
  - Cost and vendor
  - Return to service date

### 16.4 Container Financial Tracking
The operator MUST be able to:
- 16.4.a Track deposit balances by customer:
  - Deposits collected
  - Deposits owed
  - Deposits refunded
  - Net deposit position
- 16.4.b Reconcile physical containers with deposits:
  - Containers at customer vs deposits held
  - Identify discrepancies
  - Generate reconciliation reports
- 16.4.c Process deposit refunds/credits:
  - Calculate refund amounts
  - Generate credit memos
  - Track refund status
  - Apply credits to invoices
- 16.4.d Track container asset value:
  - Purchase cost and date
  - Depreciation schedule
  - Current book value
  - Replacement cost

### 16.5 Container Risk & Alerts
The operator MUST be alerted to:
- 16.5.a Overdue container returns:
  - By customer (which customers have overdue kegs)
  - By days overdue (30, 60, 90+ days)
  - By quantity and value
  - Escalation thresholds
- 16.5.b Low available container inventory:
  - Below minimum threshold
  - Projected shortages based on scheduled deliveries
  - By container type/size
- 16.5.c Containers requiring maintenance:
  - Overdue cleaning
  - Overdue inspection
  - Reported damage
  - Safety concerns
- 16.5.d Deposit balance discrepancies:
  - Physical count vs financial records
  - Customer deposit imbalances
  - Unreturned containers exceeding deposit value

### 16.6 Container Traceability
The operator MUST be able to trace:
- 16.6.a Individual container history:
  - Complete movement history (fill → delivery → return → clean → refill)
  - All state transitions with timestamps
  - All custody changes
  - All maintenance events
- 16.6.b Container location chain:
  - Current location and custody
  - Previous locations (last 5-10 moves)
  - Expected next location
  - Time at current location
- 16.6.c Container to product:
  - What product is/was in this container
  - Source batch/tank for current contents
  - Previous products (cleaning verification)
- 16.6.d Container to customer:
  - Which customer currently has this container
  - Delivery date and order
  - Expected return date
  - Customer's container history

### 16.7 Container Reporting
The operator MUST be able to generate:
- 16.7.a Container inventory reports:
  - Current state summary (by location, by state)
  - Aging reports (time in each state)
  - Utilization reports (turnover, efficiency)
- 16.7.b Customer container reports:
  - Containers at customer (current)
  - Overdue returns by customer
  - Customer deposit balances
  - Customer return performance
- 16.7.c Financial container reports:
  - Total deposit liability
  - Deposit reconciliation
  - Container asset value
  - Loss/damage costs
- 16.7.d Maintenance container reports:
  - Cleaning schedule and compliance
  - Inspection schedule and compliance
  - Maintenance costs by container
  - Container condition trends

---

## 17. Implementation Notes

### Container Identification
Containers SHOULD be uniquely identifiable via:
- Serial numbers (engraved, stamped, or tagged)
- Barcodes or QR codes
- RFID tags (optional)

The system MUST support both:
- Individual container tracking (serial number level)
- Batch container tracking (quantity level for disposables)

### Container Types
The system MUST support multiple container types:
- Kegs (various sizes: 1/6 bbl, 1/4 bbl, 1/2 bbl, etc.)
- Totes/IBCs
- Barrels
- Cases/bottles (batch level)
- Custom container types

### Multi-Location Support
Container tracking MUST support:
- Multiple facility locations
- Customer locations
- Third-party locations (cleaners, warehouses)
- In-transit status between locations

---

## End of Contract
