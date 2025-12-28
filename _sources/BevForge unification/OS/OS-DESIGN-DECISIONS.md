# BevForge OS Control Panel - Design Decisions

## Overview
This document captures all architectural decisions made during the design and implementation of the OS Control Panel system.

---

## 1. Virtual Outputs - Control Module Integration ✅

### Decision
**Control module writes to virtual_output tiles, OS propagates to hardware.**

### Implementation
1. Control module computes PID output (0-100%)
2. Control writes: `POST /api/os/command` targeting `tileId = virtual_output`
3. OS propagates value to bound hardware endpoints via `tile_endpoint_bindings`

### Benefits
- Decouples control logic from hardware mapping
- Enables mirroring/splitting/scaling (one PID → heater + cooler)
- Enables simulation/manual testing without hardware
- Still allows direct hardware writes for "expert mode"

### Example Flow
```typescript
// Control module sends:
POST /api/os/command
{
  tileId: 'virtual-fv01-temp-control',
  action: 'set_output',
  value: 65  // 65% output
}

// OS propagates to bound endpoints:
// - Endpoint 10 (heater): 30% (split range 0-50, scaled)
// - Endpoint 11 (cooler): 30% (split range 50-100, scaled)
```

---

## 2. Tile Hierarchy & Parent Relationships ✅

### Decision
**Sensors belong to vessels via `parentTileId`, with UI aggregation but no config inheritance.**

### Use Cases
- Temp sensor, gravity sensor, level switch have `parentTileId = vessel`
- UI nesting: vessel panel shows child sensor PVs
- Vessel computes "effective temp" (selected child or average) at service layer

### What NOT to do
- ❌ Don't auto-merge config objects from parent to child
- ❌ Don't enforce hard inheritance rules in schema

### Optional Light Inheritance
- If child tile has `groupId = null`, treat as "implicitly in parent's group" at query time (not stored)

---

## 3. Device Groups - Mutual Exclusion (Manifolds) ✅

### Decision
**Configurable per group via `device_groups.config.conflictPolicy`**

### Conflict Policies

#### `block` (default, safest)
- If valve B is open, command to open valve A is **blocked**
- Alarm/log explains why
- Requires manual intervention

#### `auto_close_others`
- OS automatically issues close commands to other valves in group
- Waits for confirmation
- Then opens requested valve
- Only enable when you trust feedback sensors/state reporting

#### `queue` (optional, future)
- Command waits until group is free
- More complex, not needed early

### Schema
```typescript
device_groups.config = {
  conflictPolicy: 'block' | 'auto_close_others' | 'queue',
  mutualExclusion: true,
  maxSimultaneousOpen: 1
}
```

---

## 4. Tilt Hydrometer Integration ✅

### Decision
**Model Tilt as multiple endpoints under one `gravity_sensor` tile.**

### Endpoints per Tilt
- **SG endpoint** (gravity reading)
- **Temp endpoint** (Tilt provides temperature)
- **Battery endpoint** (if available)
- **RSSI endpoint** (useful for diagnosing dropouts)

### Data Flow
- All readings flow through `telemetry_readings` like other sensors
- Identity/calibration stored in `device_tiles.config` for the `gravity_sensor` tile
- Optional `qualityReason` flags when packets are stale

### Optional Future Enhancement
**`tilt_devices` table** for fleet management:
- Multiple Tilts, swapping, calibrations
- Per-device offsets, color/UUID identity
- Only add when needed for real fleet management

### Current Approach
- Keep `tile_type = gravity_sensor`
- Store Tilt identity + calibration in `device_tiles.config`
- Add dedicated table later if fleet management becomes complex

---

## 5. Command Execution Flow ✅

### Decision
**OS is the authoritative safety gatekeeper. Nodes have minimal hard safety.**

### Flow

1. **UI → OS**: `POST /api/os/command`

2. **OS evaluates interlocks**:
   - Writes `interlock_evaluations`
   - If blocked: updates `command_log.status = blocked` (+ reason)
   - If allowed: forwards to hardware node

3. **OS → Node**: REST command (now), WebSocket (later)
   - `POST /node/command`

4. **Node replies**:
   - **ack**: "I received it and will execute"
   - **completed**: "I attempted execution; success/failure + details"

5. **OS updates lifecycle**:
   - Records ack/completed timestamps in `command_log`
   - Reconciles state

### Ownership
- **Node sends**: ack, completed
- **OS records**: lifecycle timestamps, status, reconciliation

---

## 6. Endpoint Current Cache - Update Strategy ✅

### Decision
**Push model: nodes push telemetry to OS.**

### Implementation

#### Phase 2-3 (Now)
- **Node → OS**: REST push `POST /api/os/telemetry/ingest`
- OS writes both `telemetry_readings` and updates `endpoint_current`

#### Phase 5 (Later)
- **WebSocket** for live updates (OS ↔ UI)
- Optional WebSocket OS ↔ Node for full duplex streaming

#### Fallback
- OS polling for nodes that can't push yet
- Not preferred, but supported

#### MQTT
- Optional later, not required to ship

---

## 7. Vessel State Management ✅

### Decision
**Use both `status` enum and `config` flags, with clear separation.**

### Schema Usage

#### `device_tiles.status` (small enum)
Common operational modes:
- `normal`
- `cip` (clean-in-place)
- `maintenance`
- `disabled`
- `fault`

#### `device_tiles.config` (custom flags/details)
Extended state information:
- CIP step number
- Target temperature
- Maintenance notes
- Custom flags

#### `device_state_history`
- Every state change logged
- Includes: old status, new status, timestamp, user, reason

### Example
```typescript
// Vessel tile
{
  status: 'cip',
  config: {
    cipStep: 3,
    cipTargetTemp: 80,
    cipStartedAt: '2025-12-27T10:00:00Z',
    cipNotes: 'Caustic wash cycle'
  }
}

// State history entry
{
  tileId: 'vessel-fv01',
  oldStatus: 'normal',
  newStatus: 'cip',
  changedAt: '2025-12-27T10:00:00Z',
  changedBy: 'user-123',
  reason: 'Starting CIP cycle'
}
```

---

## 8. Safety Interlocks - Evaluation Timing ✅

### Decision
**Do both reactive and proactive evaluation.**

### Reactive (Required MVP)
- Evaluate on every command
- Block/allow based on current conditions
- Log evaluation in `interlock_evaluations`

### Proactive (Recommended for "trip" interlocks)
- Periodic evaluation loop in OS (250-1000ms)
- Triggers:
  - Alarms
  - Automatic force-off (if configured)
  - State changes

### Implementation Priority
1. **Ship reactive first** (Phase 3)
2. **Add proactive later** (Phase 5)
3. Schema already supports both (no changes needed)

### Example
```typescript
// Reactive: evaluated on command
if (command.action === 'start_pump') {
  const interlocks = getInterlocks(command.targetTileId);
  const passed = evaluateInterlocks(interlocks);
  if (!passed) {
    blockCommand();
  }
}

// Proactive: continuous monitoring
setInterval(() => {
  const tripInterlocks = getActiveInterlocks({ mode: 'trip' });
  for (const interlock of tripInterlocks) {
    if (isViolated(interlock)) {
      forceOff(interlock.affectedTiles);
      triggerAlarm(interlock);
    }
  }
}, 500); // 500ms
```

---

## 9. Telemetry Retention & Downsampling ✅

### Decision
**Schema + indexes now, downsampling later.**

### Implementation Plan

#### Phase 2-3 (Now)
- Implement table structure
- Add proper indexes for query patterns
- Store full-resolution data

#### Phase 4-5 (Later)
- Add retention/downsampling as scheduled job
- Example: 90 days full resolution → hourly averages → archive

#### Database Choice
- **Now**: Plain MySQL tables with good indexes
- **Future**: TimescaleDB if migrating to Postgres (optional)

### No Action Required Now
- Don't implement downsampling logic yet
- Don't worry about storage optimization yet
- Focus on correct data capture

---

## 10. Flow Meter Totalizers ✅

### Decision
**Separate `flow_meter_totals` table for atomic updates, with audit logging.**

### Schema

#### New Table: `flow_meter_totals`
```typescript
{
  tileId: number,           // or endpointId
  lifetimeTotal: decimal,
  sessionTotal: decimal,
  updatedAt: timestamp
}
```

#### Resets Logged In
1. **`command_log`** (standard command logging)
2. **`totalizer_events`** (optional, for clean audit queries):
   - who reset
   - when
   - previous value
   - new value
   - reason

### Why Not Store in `flow_meter.config`?
- Frequent updates to JSON fields are inefficient
- Harder to ensure atomic updates
- Difficult to query/aggregate

---

## 11. Alarm Acknowledgment Workflow ✅

### Decision
**Support both auto-clear and manual acknowledgment.**

### Alarm Lifecycle

#### States
- `active` - Alarm condition is true, not acknowledged
- `cleared_unacked` - Condition resolved, but not acknowledged
- `cleared_acked` - Condition resolved and acknowledged

#### Auto-Clear
- Alarm can auto-clear when condition resolves
- Sets `clearedAt` timestamp
- Status changes to `cleared_unacked`

#### Manual Acknowledgment
- Separate from clearing
- Sets `ackedAt`, `ackedBy`
- Status changes to `cleared_acked`

### Schema
```typescript
alarm_events {
  status: 'active' | 'cleared_unacked' | 'cleared_acked',
  triggeredAt: timestamp,
  clearedAt: timestamp | null,
  ackedAt: timestamp | null,
  ackedBy: string | null
}
```

### No History Table Needed
- Keep all alarms in same table
- Query by status/time ranges
- Archive old alarms with scheduled job (later)

---

## 12. Batch Context in Telemetry ✅

### Decision
**OS auto-associates telemetry with active batches when possible.**

### How OS Knows

#### Option A: `device_tiles.activeBatchId`
Simple, works for single-batch-per-vessel:
```typescript
device_tiles {
  activeBatchId: number | null
}
```

#### Option B: `vessel_batch_sessions` table (better long-term)
Supports complex scenarios:
```typescript
vessel_batch_sessions {
  vesselTileId: number,
  batchId: number,
  startedAt: timestamp,
  endedAt: timestamp | null,
  isPrimary: boolean  // For multi-batch scenarios
}
```

### Telemetry Ingest Logic
```typescript
// On telemetry ingest:
if (endpoint belongs to vessel with active batch) {
  telemetryReading.batchId = vessel.activeBatchId;
}
```

### Manual Override
- Allow manual `batchId` override in telemetry API
- Useful for corrections, testing, special cases

---

## 13. Hardware Node Communication Protocol ✅

### Decision
**Ship in phases: REST now, WebSocket later.**

### Phase 2-3 (Now - Fastest to Implement)

#### OS → Node
- REST command: `POST /node/command`
- Simple, reliable, easy to debug

#### Node → OS
- REST telemetry push: `POST /api/os/telemetry/ingest`
- Batch updates supported

### Phase 5 (Later - Real-time)

#### OS ↔ UI
- WebSocket for real-time updates
- Live telemetry streaming
- Command status updates

#### OS ↔ Node (Optional)
- WebSocket for full duplex streaming
- Lower latency
- Persistent connection

### MQTT
- Optional, don't let it slow Phase 2-6
- Consider if you need pub/sub patterns
- Not required for MVP

---

## 14. Failsafe Behavior ✅

### Decision
**Three-level hierarchy with overrides.**

### Levels (in resolution order)

#### 1. Controller Default (Broadest)
```typescript
controller_nodes.config.defaultFailsafeMode = 'all_off' | 'hold_last' | 'custom'
```

#### 2. Endpoint Failsafe (Per Channel)
```typescript
hardware_endpoints.failsafeValue = 'false' | '0' | 'last' | ...
```

#### 3. Tile Override (Most Specific)
```typescript
device_tiles.config.failsafeAction = 'force_off' | 'hold' | 'safe_value'
```

### Resolution Order
```
tile override → endpoint failsafe → controller default
```

### Example
```typescript
// Controller: all outputs off by default
controller.config.defaultFailsafeMode = 'all_off'

// Endpoint: this specific relay holds last value
endpoint.failsafeValue = 'last'

// Tile: this pump must force off (overrides endpoint)
tile.config.failsafeAction = 'force_off'

// Result: pump forces off (tile override wins)
```

---

## 15. Multi-Binding Transforms ✅

### Decision
**Directional transforms: separate input and output transformations.**

### Schema Options

#### Option A: Separate Fields (Recommended)
```typescript
tile_endpoint_bindings {
  transformInput: {
    scale: 1.8,
    offset: 32,
    clamp: { min: 0, max: 100 }
  },
  transformOutput: {
    scale: 0.5556,
    offset: -17.78
  }
}
```

#### Option B: Single Field with Direction
```typescript
tile_endpoint_bindings {
  transform: {
    direction: 'input' | 'output' | 'both',
    scale: 1.8,
    offset: 32
  }
}
```

### When to Apply

#### Input Transform (Ingest)
- **Raw → Engineering Units**
- Applied before writing `endpoint_current`
- Example: ADC counts → °C

#### Output Transform (Command)
- **Engineering → Raw**
- Applied before sending to node
- Example: °C → ADC counts

### Optional Enhancement (Later)
**`displayTransform`** for UI-only formatting:
- Doesn't affect control values
- Example: °C → °F for display
- Applied in UI layer, not stored in telemetry

### Example
```typescript
// Temperature sensor binding
{
  bindingRole: 'pv',
  direction: 'read',
  transformInput: {
    // Convert ADC (0-4095) to °C (-50 to 150)
    scale: 0.0488,
    offset: -50,
    clamp: { min: -50, max: 150 },
    smoothing: 5  // 5-sample moving average
  }
}

// Heater output binding
{
  bindingRole: 'output',
  direction: 'write',
  transformOutput: {
    // Convert % (0-100) to PWM (0-255)
    scale: 2.55,
    clamp: { min: 0, max: 255 }
  }
}
```

---

## Summary

All 15 design questions have been answered with clear implementation guidance. The schema and architecture are now fully defined and ready for Phase 3 (API implementation).

### Key Principles

✅ **Separation of Concerns**: Control logic decoupled from hardware
✅ **Safety First**: OS is authoritative gatekeeper
✅ **Flexibility**: Configurable policies, overrides, transforms
✅ **Auditability**: Full lifecycle tracking, explainability
✅ **Scalability**: Push model, proper indexing, future-proof schema
✅ **Pragmatism**: Ship simple first, add complexity later
