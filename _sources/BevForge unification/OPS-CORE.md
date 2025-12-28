
# OPS-CORE.md
## BevForge OPS — Operational Source of Truth

### 0. Authority & Intent
This document defines WHAT BevForge OPS is responsible for and WHY.
It is a binding source of truth for backend systems, automations, and AI coding tools.
Implementations MUST conform to this document.

---

## 1. Purpose of OPS
OPS is the operational system of record for beverage alcohol businesses (cidery, winery, brewery).
It exists to:
- Maintain legal, auditable operational facts
- Track inventory, movement, and custody
- Support sales, deliveries, and revenue operations
- Enforce compliance timing and reporting readiness
- Provide automation that reduces operator cognitive load

OPS is not intended to replace payroll, HR, or full accounting platforms.

---

## 2. Operational Ownership
OPS OWNS:
- Inventory state and movement
- Compliance events and timelines
- Orders, deliveries, and removals
- Directory of customers, vendors, facilities
- Operational tasks and approvals
- Automation rules tied to ops events

OPS CONSUMES (read-only):
- Production metadata (Lab)
- Dispense data (Flow)
- Identity and auth (OS)
- Communication context (Connect)

---

## 3. Facts, Events, and State Model
3.1 Facts are immutable records of events.
3.2 State is derived from facts.
3.3 Facts may never be deleted.
3.4 Corrections occur via compensating facts.
3.5 Every fact records:
- Timestamp
- Actor (user or automation)
- Source
- Affected entities

---

## 4. Inventory & Custody
OPS MUST track:
- Quantity
- Container (keg, case, bulk)
- Location
- Legal status (bonded, unbonded, in-transit)
- Ownership/custody

Inventory movement MUST be recorded as events.

---

## 5. Orders, Sales, and Revenue
OPS MUST support:
- Order creation and lifecycle
- Pricing tiers
- Order fulfillment tracking
- Invoice generation readiness
- Payment status tracking (not payment processing)

Orders may exist without deliveries.
Deliveries may exist without immediate payment.

---

## 6. Deliveries
Deliveries are first-class operational events.
A delivery MUST:
- Reference inventory items
- Define origin and destination
- Change custody/location
- Optionally trigger removal

---

## 7. Compliance
OPS MUST:
- Track removals
- Associate removals with tax liability
- Track reporting periods
- Lock periods once filed
- Provide audit-ready history

OPS does not file reports automatically (by default).

---

## 8. Directory (CRM)
OPS maintains a directory of:
- Customers
- Vendors
- Host facilities
- Event venues

Each directory entity MUST support:
- Operational history
- Legal identifiers
- Financial terms

---

## 9. Automation
OPS automation MAY:
- Run scheduled jobs
- React to events
- Generate tasks and alerts
- Update derived state

Automation MUST:
- Be idempotent
- Never delete facts
- Be auditable

---

## 10. Tasks & Approvals
OPS MUST support:
- Task creation
- Assignment
- Due dates
- Approval tracking
- Audit trail

---

## 11. Integrations
OPS MUST be integration-ready but not dependent.
Exports to accounting systems are allowed.
No payroll or HR logic is required.

---

## 12. Change Control
Any change to OPS responsibilities requires updating this document.
