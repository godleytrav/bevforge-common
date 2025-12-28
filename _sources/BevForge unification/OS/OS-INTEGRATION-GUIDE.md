# BevForge OS Integration Guide

**Purpose:** This document provides everything needed to integrate the OS (Operations System) with other BevForge suites.

## Quick Reference

- **OS Location:** `OS/` directory (standalone system)
- **Main Entry:** `/os/control-panel` route
- **Database:** 25 tables (14 OS-specific + 11 inventory shared)
- **API Prefix:** `/api/os/*`
- **Tech Stack:** React 19 + TypeScript + Vite + Drizzle ORM + MySQL

---

## System Overview

### What is OS?

The **Operations System (OS)** is a real-time brewing equipment control panel with:
- Visual canvas-based device management
- Hardware abstraction layer (nodes → endpoints → tiles)
- Safety interlock system
- Command pipeline with lifecycle tracking
- Telemetry monitoring and alarms
- SVG equipment visualizations

### Current Status

✅ **Phase 6 COMPLETE** - Production-ready control panel with real API integration
- 10 REST API endpoints operational
- Production-ready interlock evaluation
- SVG equipment library (6 vessel types)
- Optimistic UI updates with error rollback

---

## Architecture

### Three-Layer Hardware Abstraction

```
Controller Nodes (Raspberry Pi, Arduino)
    ↓
Hardware Endpoints (sensors, actuators)
    ↓
Device Tiles (visual canvas representation)
```

### Key Concepts

1. **Controller Nodes:** Physical hardware controllers (IP address, protocol)
2. **Hardware Endpoints:** Individual I/O points (GPIO pins, sensors, valves)
3. **Device Tiles:** Visual representations on canvas (pumps, vessels, sensors)
4. **Bindings:** Link tiles to endpoints (one tile can control multiple endpoints)
5. **Safety Interlocks:** Rules that prevent unsafe operations
6. **Command Pipeline:** Queued → Sent → Acknowledged → Succeeded/Failed

---

## Database Schema

### OS-Specific Tables (14)

#### Core Hardware
- `controller_nodes` - Physical controllers (IP, protocol, status)
- `hardware_endpoints` - I/O points (nodeId, address, direction, dataType)
- `endpoint_current` - Fast cache for latest telemetry values

#### Visual Layer
- `device_tiles` - Canvas items (x, y, type, displayMode, config JSON)
- `tile_endpoint_bindings` - Links tiles to endpoints (role: primary/secondary/monitor)
- `device_groups` - Logical grouping (mutual exclusion)

#### Safety & Control
- `safety_interlocks` - Rules (affectedTiles, condition, severity)
- `interlock_evaluations` - Evaluation history
- `system_safety_state` - Global safety status
- `system_safety_log` - Audit trail

#### Telemetry & Commands
- `telemetry_readings` - Time-series data (endpointId, value, timestamp)
- `command_log` - Command lifecycle (status, timing, correlation)
- `device_state_history` - State change tracking
- `alarm_events` - Alarm history

### Shared Tables (11)

Inventory tables shared with other suites:
- `malts`, `hops`, `yeasts`, `fruits`, `generic_items`
- `inventory_transactions`, `inventory_adjustments`
- `suppliers`, `purchase_orders`, `po_line_items`, `recipes`

---

## API Endpoints

### Core Read APIs (8)

```
GET /api/os/nodes              - List all controller nodes
GET /api/os/endpoints          - List all hardware endpoints
GET /api/os/tiles              - Canvas render payload (fast)
GET /api/os/tiles/:id          - Tile detail with bindings (?include=current)
GET /api/os/groups             - Device groups
GET /api/os/bindings           - All tile-endpoint bindings
GET /api/os/telemetry/latest   - Current values (fast cache)
GET /api/os/alarms             - Active alarms
```

### Command Pipeline (2)

```
POST /api/os/command           - Execute command (with interlock evaluation)
GET /api/os/command/:commandId - Query command status
```

### Command Request Format

```typescript
{
  endpointId: number,           // Target endpoint ID
  commandType: 'write' | 'toggle' | 'pulse',
  value?: boolean | number | string,  // For write commands
  correlationId?: string,       // Optional tracking ID
  overrideInterlocks?: boolean  // Admin override (use carefully)
}
```

### Command Response

```typescript
{
  success: boolean,
  commandId: string,            // UUID for status tracking
  status: 'queued' | 'sent' | 'acked' | 'succeeded' | 'failed' | 'blocked',
  message?: string,
  interlockViolations?: Array<{
    interlockId: number,
    reason: string,
    severity: 'critical' | 'warning' | 'info'
  }>
}
```

---

## Key Components

### Control Panel (`src/pages/os/ControlPanelPage.tsx`)

**Main Features:**
- Single-canvas two-mode system (Edit/Control)
- Real-time device state updates
- Drag-and-drop device placement
- SVG equipment visualizations
- Production-ready interlock evaluation

**Component Structure:**
```tsx
ControlPanelPage
  ├── Mode Toggle (Edit/Control)
  ├── DeviceCanvas (grid + devices)
  │   └── EquipmentRenderer (SVG or tile)
  ├── Hardware Config Dialog
  └── Control Panel (device details)
```

### SVG Equipment Library (`src/components/BrewingEquipmentSVGs.tsx`)

**6 Professional Vessel Types:**
- ConicalFermentor
- BrightTank
- HotLiquorTank
- MashTun
- BrewKettle
- GenericVessel

**Features:**
- Animated fill levels (0-100%)
- Temperature displays
- Gradient backgrounds for 3D depth
- Vessel-specific colors

### Equipment Renderer (`src/components/EquipmentRenderer.tsx`)

**Automatic Mode Switching:**
- SVG mode for vessels (displayMode: 'svg')
- Tile mode for pumps/valves/sensors (displayMode: 'tile')
- Double-click to edit in Edit mode
- Click to control in Control mode

---

## Integration Patterns

### Pattern 1: Navigation Integration

**Add OS to Suite Menu:**

```tsx
// In main app navigation
const suiteMenuItems = [
  {
    id: 'ops',
    label: 'Operations',
    icon: <Settings />,
    subItems: [
      { label: 'Control Panel', href: '/os/control-panel' },
      { label: 'Devices', href: '/os/devices' },
      { label: 'Alarms', href: '/os/alarms' },
      { label: 'Inventory', href: '/os/inventory' },
    ]
  },
  // ... other suites
];
```

### Pattern 2: Shared Component Usage

**OS components can be imported by other suites:**

```tsx
// In another suite
import { EquipmentRenderer } from '@/components/EquipmentRenderer';
import { ConicalFermentor } from '@/components/BrewingEquipmentSVGs';

// Display equipment status in dashboard
<EquipmentRenderer
  device={deviceData}
  mode="control"
  onClick={handleDeviceClick}
/>
```

### Pattern 3: API Integration

**Other suites can call OS APIs:**

```tsx
// Get current telemetry for dashboard widgets
const response = await fetch('/api/os/telemetry/latest');
const telemetry = await response.json();

// Execute command from recipe automation
const commandResponse = await fetch('/api/os/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpointId: 5,
    commandType: 'write',
    value: 65.5,  // Set temperature to 65.5°C
    correlationId: `recipe-step-${stepId}`
  })
});
```

### Pattern 4: Shared Database Access

**Inventory tables are shared:**

```typescript
// OS can read inventory for recipe execution
import { db } from '@/server/db/client';
import { malts, hops } from '@/server/db/schema';

const availableMalts = await db.select().from(malts);

// Other suites can read OS telemetry
import { telemetryReadings } from '@/server/db/schema';

const recentTemps = await db
  .select()
  .from(telemetryReadings)
  .where(eq(telemetryReadings.endpointId, 3))
  .orderBy(desc(telemetryReadings.timestamp))
  .limit(100);
```

---

## Integration Checklist

### For New Suite Integration

- [ ] **Navigation:** Add OS links to suite menu
- [ ] **Routing:** Ensure `/os/*` routes are accessible
- [ ] **Database:** Verify shared tables (inventory) are accessible
- [ ] **API Access:** Test calling `/api/os/*` endpoints
- [ ] **Components:** Import and test OS components if needed
- [ ] **Styling:** Ensure consistent theme (CSS variables)
- [ ] **Authentication:** Apply same auth rules to OS routes
- [ ] **Permissions:** Define role-based access (admin, operator, viewer)

### For OS to Access Other Suites

- [ ] **API Discovery:** Document other suite APIs
- [ ] **Data Models:** Understand other suite schemas
- [ ] **Event Hooks:** Define integration points (e.g., recipe start → OS automation)
- [ ] **Shared State:** Use consistent state management patterns

---

## Common Integration Scenarios

### Scenario 1: Recipe Automation

**Use Case:** Recipe suite triggers OS commands during brew day

```typescript
// Recipe suite calls OS API
async function executeBrewStep(step: BrewStep) {
  // Set mash temperature
  await fetch('/api/os/command', {
    method: 'POST',
    body: JSON.stringify({
      endpointId: step.targetEndpointId,
      commandType: 'write',
      value: step.targetTemperature,
      correlationId: `recipe-${recipeId}-step-${step.id}`
    })
  });
  
  // Monitor temperature until target reached
  const interval = setInterval(async () => {
    const telemetry = await fetch('/api/os/telemetry/latest');
    const data = await telemetry.json();
    const currentTemp = data.find(t => t.endpointId === step.targetEndpointId);
    
    if (currentTemp.valueNum >= step.targetTemperature) {
      clearInterval(interval);
      proceedToNextStep();
    }
  }, 5000);
}
```

### Scenario 2: Dashboard Widgets

**Use Case:** Main dashboard shows OS equipment status

```tsx
// Dashboard component
function EquipmentStatusWidget() {
  const [devices, setDevices] = useState([]);
  
  useEffect(() => {
    fetch('/api/os/tiles')
      .then(r => r.json())
      .then(setDevices);
  }, []);
  
  return (
    <Card>
      <CardHeader>Equipment Status</CardHeader>
      <CardContent>
        {devices.map(device => (
          <div key={device.id}>
            <span>{device.name}</span>
            <Badge variant={device.status === 'online' ? 'success' : 'destructive'}>
              {device.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Scenario 3: Inventory Integration

**Use Case:** OS tracks ingredient usage during brewing

```typescript
// OS records ingredient consumption
import { inventoryTransactions } from '@/server/db/schema';

async function recordIngredientUsage(recipeId: number, maltId: number, amountKg: number) {
  await db.insert(inventoryTransactions).values({
    itemType: 'malt',
    itemId: maltId,
    transactionType: 'usage',
    quantity: -amountKg,  // Negative for consumption
    unitOfMeasure: 'kg',
    referenceType: 'recipe',
    referenceId: recipeId,
    notes: 'Used in brew session',
    transactionDate: new Date()
  });
}
```

---

## Configuration

### Environment Variables

```bash
# Database (shared across all suites)
DATABASE_URL=mysql://user:pass@localhost:3306/bevforge

# OS-specific (if needed)
OS_TELEMETRY_RETENTION_DAYS=30
OS_COMMAND_TIMEOUT_MS=5000
OS_INTERLOCK_STRICT_MODE=true
```

### Shared CSS Variables

```css
/* Ensure consistent theming across suites */
:root {
  --primary: <hue> <saturation>% <lightness>%;
  --background: <hue> <saturation>% <lightness>%;
  /* ... other theme variables */
}
```

---

## Testing Integration

### Integration Test Example

```typescript
// Test OS API from another suite
import { describe, it, expect } from 'vitest';

describe('OS Integration', () => {
  it('should execute command from recipe suite', async () => {
    const response = await fetch('/api/os/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpointId: 1,
        commandType: 'toggle',
        correlationId: 'test-recipe-123'
      })
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.commandId).toBeDefined();
  });
  
  it('should fetch telemetry for dashboard', async () => {
    const response = await fetch('/api/os/telemetry/latest');
    const telemetry = await response.json();
    
    expect(Array.isArray(telemetry)).toBe(true);
    expect(telemetry[0]).toHaveProperty('endpointId');
    expect(telemetry[0]).toHaveProperty('valueNum');
  });
});
```

---

## Security Considerations

### Authentication

- All `/api/os/*` endpoints should require authentication
- Use same auth middleware as other suites
- Consider role-based access:
  - **Admin:** Full control (can override interlocks)
  - **Operator:** Standard control (respects interlocks)
  - **Viewer:** Read-only access

### Command Authorization

```typescript
// Example middleware
function requireOperatorRole(req, res, next) {
  if (!req.user || !['admin', 'operator'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

// Apply to command endpoint
app.post('/api/os/command', requireOperatorRole, commandHandler);
```

### Interlock Override

- Only admins should be able to override interlocks
- Log all override attempts
- Require confirmation for critical overrides

---

## Performance Considerations

### Caching Strategy

- `endpoint_current` table caches latest telemetry (fast reads)
- `/api/os/tiles` excludes telemetry joins (fast canvas render)
- Use `?include=current` query param only when needed

### Real-Time Updates

- Phase 7 WebSocket implementation documented in `PHASE-7-WEBSOCKET-PLAN.md`
- Optional for MVP, recommended for production
- Enables multi-user sync and live telemetry updates

### Database Indexing

```sql
-- Critical indexes for performance
CREATE INDEX idx_telemetry_endpoint_time ON telemetry_readings(endpointId, timestamp DESC);
CREATE INDEX idx_command_status ON command_log(status, queuedAt);
CREATE INDEX idx_endpoint_current_lookup ON endpoint_current(endpointId);
```

---

## Troubleshooting

### Common Issues

**Issue:** Commands fail with interlock violations
- **Solution:** Check `safety_interlocks` table, verify endpoint states
- **Debug:** Query `/api/os/telemetry/latest` to see current values

**Issue:** Telemetry not updating
- **Solution:** Verify nodes are pushing data to `/api/os/telemetry/ingest`
- **Debug:** Check `endpoint_current` table for stale timestamps

**Issue:** Canvas devices not rendering
- **Solution:** Ensure `device_tiles` has valid x/y coordinates
- **Debug:** Check browser console for React errors

**Issue:** SVG equipment not displaying
- **Solution:** Verify `displayMode: 'svg'` in tile config
- **Debug:** Check `vesselType` matches available SVG components

---

## Documentation References

### Core Documentation

- `OS-README.md` - Quick start guide
- `OS-CONTROL-SCHEMA-DESIGN.md` - Database schema details
- `OS-DESIGN-DECISIONS.md` - Architecture rationale
- `OS-MODULE-GUIDE.md` - Component documentation
- `OS-IMPLEMENTATION-ROADMAP.md` - Development phases

### Phase Completion Reports

- `PHASE-3.1-COMPLETION-REPORT.md` - Core Read APIs
- `PHASE-3.2-COMMAND-PIPELINE-GUIDE.md` - Command execution
- `PHASE-4-SEED-DATA-COMPLETE.md` - Test data
- `PHASE-5-TEST-RESULTS.md` - Testing outcomes
- `PHASE-6-COMPLETION-REPORT.md` - Control Panel integration
- `PHASE-7-WEBSOCKET-PLAN.md` - Real-time updates (optional)

---

## Contact & Support

For questions about OS integration:
1. Review this guide first
2. Check phase completion reports for detailed implementation
3. Review database schema in `OS-CONTROL-SCHEMA-DESIGN.md`
4. Test APIs using seed data (`npm run seed`)

---

## Version History

- **v1.0** (Dec 2025) - Initial integration guide
  - Phase 6 complete (production-ready control panel)
  - 10 REST APIs operational
  - SVG equipment library
  - Production-ready interlocks

---

**Last Updated:** December 27, 2025  
**OS Version:** Phase 6 Complete  
**Status:** Production-Ready (WebSocket optional)
