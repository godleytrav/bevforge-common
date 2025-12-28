# BevForge OS Control Panel - Module Guide

## Overview
This guide explains how to use the OS Control Panel system for managing brewery/winery automation hardware, devices, and real-time monitoring.

## Database Schema Summary

### Core Tables (25 Total)

**Inventory Management (11 tables):**
- `units_of_measure` - UOM definitions with conversions
- `locations` - Hierarchical location tracking
- `items` - Materials catalog with category-specific data
- `lots` - Lot/batch traceability
- `inventory_ledger` - Immutable movement log (canonical source)
- `inventory_balances` - Current state (derived from ledger)
- `batches` - Production runs
- `batch_materials` - Planned vs actual usage
- `batch_outputs` - What batches produce
- `batch_transfers` - Tank/vessel movements
- `fermentation_logs` - Temperature, gravity tracking

**OS Control Panel (14 tables):**
- `controller_nodes` - Physical hardware (Pi, ESP32, etc.)
- `hardware_endpoints` - I/O channels with capability metadata
- `endpoint_current` - Fast-access cache for current values
- `device_tiles` - Virtual devices on canvas
- `tile_endpoint_bindings` - Multi-bind tile-to-hardware mapping
- `device_groups` - Layout/safety zones/manifolds
- `system_safety_state` - E-stop and global safety state
- `system_safety_log` - Safety state transitions
- `telemetry_readings` - Time-series sensor data
- `command_log` - Full audit trail with lifecycle tracking
- `safety_interlocks` - Safety rules with explainability
- `interlock_evaluations` - Interlock evaluation log
- `device_state_history` - State change tracking
- `alarm_events` - Alarm tracking and acknowledgment

---

## Key Concepts

### 1. Hardware Abstraction Layer

**Controller Nodes** represent physical hardware:
- Raspberry Pi, ESP32, Arduino, I/O hubs
- Track online/offline status, heartbeat, firmware version
- Store capabilities (number of DI/DO/AI/AO/PWM channels)

**Hardware Endpoints** represent individual I/O channels:
- GPIO pins, sensors, relays, PWM outputs
- Store capability metadata (kind, value type, units, scaling)
- Support DI, DO, AI, AO, PWM, I2C, SPI, UART, 1-Wire, Modbus, VIRTUAL

**Device Tiles** are virtual devices on the UI canvas:
- Vessels, pumps, valves, sensors, virtual outputs, status tiles
- Store configuration (PID settings, alarm thresholds, etc.)
- Positioned on canvas for visual layout

**Tile-Endpoint Bindings** connect tiles to hardware:
- Multi-bind support (one tile → many endpoints)
- Role-based (pv, sp, output, state, alarm, permissive)
- Per-binding transforms (scale, offset, clamp, smoothing, etc.)

### 2. Tile Types

**Physical Device Tiles:**
- `vessel` - Fermenters, brites, totes, kegs
- `temp_sensor` - DS18B20, thermocouples, RTDs
- `gravity_sensor` - Tilt hydrometers, iSpindel
- `flow_meter` - Hall-effect, turbine, paddlewheel
- `pump` - Transfer pumps with speed control
- `valve` - Solenoid, motorized, pneumatic
- `relay_ssr` - Generic relay/SSR outputs
- `digital_input` - Switches, floats, e-stops
- `analog_input` - Pressure, level, pH sensors

**Virtual Tiles:**
- `virtual_output` - Computed/control signals (mirrored, split, simulated)
- `status_tile` - UI tiles for alarms/interlocks/node health

### 3. Virtual Outputs (Critical for Control Module)

Virtual outputs are computed/control signals that feed multiple endpoints:

**Use Cases:**
- **Mirrored outputs**: One signal → multiple SSRs (redundancy)
- **Split control**: 0-50% → heater, 50-100% → cooler
- **Simulation**: Test control logic without hardware
- **Control module migration**: PID output → virtual → hardware

**Configuration:**
```typescript
{
  outputType: 'split',
  valueType: 'float',
  unit: '%',
  rangeMin: 0,
  rangeMax: 100,
  splitRanges: [
    { min: 0, max: 50, targetEndpointId: 101, scale: 2 },  // Heater
    { min: 50, max: 100, targetEndpointId: 102, scale: 2 } // Cooler
  ]
}
```

### 4. Safety System

**System Safety State** (global):
- E-stop active/inactive
- Safety mode (normal, restricted, maintenance, emergency)
- Latching and acknowledgment

**Safety Interlocks** (rules):
- Permissive (must be true to allow action)
- Trip (force off when violated)
- Advisory (warn only)
- Timer-based (min on/off times)
- Mutual exclusion (manifolds)

**Interlock Evaluations** (explainability):
- Every blocked command logged
- Details: which condition failed, current PVs, thresholds
- Action taken: blocked, forced off, alarm triggered

**Example Interlock:**
```typescript
{
  name: "Pump Dry Run Protection",
  interlockType: "permissive",
  mode: "trip",
  condition: {
    inputTileId: 5,  // Float switch
    requiredState: true  // Must be HIGH (liquid present)
  },
  affectedTiles: [10],  // Pump tile ID
  blockActions: ["start", "turn_on"],
  onViolationAction: "force_off",
  severity: "critical"
}
```

### 5. Command Lifecycle

Every command goes through a full lifecycle:

1. **Requested** - User clicks button, API receives request
2. **Queued** - Command enters queue
3. **Safety Check** - Interlocks evaluated
4. **Sent** - Command sent to hardware node
5. **Acked** - Node acknowledges receipt
6. **Completed** - Action confirmed

**Correlation IDs** link related commands:
- One button click → multiple commands (open valve + start pump)
- All share same `correlationId`
- Enables tracing entire operation

### 6. Telemetry Storage

**endpoint_current** (fast cache):
- Single row per endpoint
- Latest value only
- Used for UI display

**telemetry_readings** (time-series):
- All historical readings
- Indexed by (endpointId, timestamp)
- Supports batch context
- Quality flags (good, uncertain, bad)
- Source tracking (hardware, derived, manual, sim)

---

## Common Workflows

### Workflow 1: Add a New Controller Node

```typescript
// 1. Insert controller node
const node = await db.insert(controllerNodes).values({
  nodeId: 'pi-brewhouse-01',
  name: 'Brewhouse Raspberry Pi',
  nodeType: 'raspberry_pi',
  ipAddress: '192.168.1.100',
  status: 'online',
  capabilities: {
    digitalOutputs: 8,
    digitalInputs: 8,
    oneWireBus: true
  },
  config: {
    pollingIntervalMs: 1000,
    timeoutMs: 5000,
    failsafeMode: 'all_off'
  }
});

// 2. Add endpoints for this node
const endpoints = await db.insert(hardwareEndpoints).values([
  {
    controllerId: node.insertId,
    channelId: 'GPIO17',
    endpointKind: 'DO',
    valueType: 'bool',
    direction: 'output',
    writeMode: 'latched',
    failsafeValue: 'false'
  },
  {
    controllerId: node.insertId,
    channelId: '1WIRE_0',
    endpointKind: '1WIRE',
    valueType: 'float',
    direction: 'input',
    unit: '°C',
    samplePeriodMs: 5000,
    config: {
      sensorAddress: '28-0000000a1b2c'
    }
  }
]);
```

### Workflow 2: Create a Vessel Tile with Sensors

```typescript
// 1. Create vessel tile
const vessel = await db.insert(deviceTiles).values({
  tileId: 'vessel-fv01',
  name: 'Fermenter FV-01',
  tileType: 'vessel',
  positionX: 100,
  positionY: 200,
  config: {
    vesselType: 'fermenter',
    capacity: 10,
    capacityUnit: 'bbl',
    pidConfig: {
      enabled: true,
      mode: 'auto',
      setpoint: 68,
      kp: 10,
      ki: 0.5,
      kd: 2,
      outputMin: 0,
      outputMax: 100,
      direction: 'reverse'  // Cooling
    },
    alarms: {
      tempHighC: 25,
      tempLowC: 10
    }
  }
});

// 2. Create temp sensor tile
const tempSensor = await db.insert(deviceTiles).values({
  tileId: 'temp-fv01-primary',
  name: 'FV-01 Primary Temp',
  tileType: 'temp_sensor',
  parentTileId: vessel.insertId,
  config: {
    sensorType: 'ds18b20',
    unit: 'C',
    smoothingWindow: 5
  }
});

// 3. Bind temp sensor to hardware endpoint
await db.insert(tileEndpointBindings).values({
  tileId: tempSensor.insertId,
  endpointId: 2,  // 1-Wire endpoint from above
  bindingRole: 'pv',
  direction: 'read',
  role: 'primary_temp',
  transform: {
    smoothing: 5,
    clamp: { min: -10, max: 40 }
  }
});

// 4. Link temp sensor to vessel
await db.update(deviceTiles)
  .set({
    config: {
      ...vessel.config,
      primaryTempSensorId: tempSensor.insertId
    }
  })
  .where(eq(deviceTiles.id, vessel.insertId));
```

### Workflow 3: Create a Virtual Output with Split Control

```typescript
// 1. Create virtual output tile
const virtualOutput = await db.insert(deviceTiles).values({
  tileId: 'virtual-fv01-temp-control',
  name: 'FV-01 Temperature Control Output',
  tileType: 'virtual_output',
  config: {
    outputType: 'split',
    valueType: 'float',
    unit: '%',
    rangeMin: 0,
    rangeMax: 100,
    splitRanges: [
      {
        min: 0,
        max: 50,
        targetEndpointId: 10,  // Heater SSR
        scale: 2,
        offset: 0
      },
      {
        min: 50,
        max: 100,
        targetEndpointId: 11,  // Cooler SSR
        scale: 2,
        offset: -100
      }
    ]
  }
});

// 2. Link virtual output to vessel
await db.update(deviceTiles)
  .set({
    config: {
      ...vessel.config,
      coolingOutputId: virtualOutput.insertId
    }
  })
  .where(eq(deviceTiles.id, vessel.insertId));
```

### Workflow 4: Log a Command with Full Lifecycle

```typescript
import { v4 as uuidv4 } from 'uuid';

// 1. Create command
const commandId = uuidv4();
const correlationId = uuidv4();

const command = await db.insert(commandLog).values({
  commandId,
  correlationId,
  requestedAt: new Date(),
  commandType: 'manual',
  action: 'start_pump',
  targetTileId: 10,
  requestedValue: 'true',
  status: 'queued',
  requestedByUserId: 'user-123',
  requestedByService: 'control_panel'
});

// 2. Check interlocks
const interlocks = await db.select()
  .from(safetyInterlocks)
  .where(and(
    eq(safetyInterlocks.isActive, true),
    // Check if this tile is affected
  ));

for (const interlock of interlocks) {
  const passed = evaluateInterlock(interlock);
  
  await db.insert(interlockEvaluations).values({
    interlockId: interlock.id,
    evaluatedAt: new Date(),
    result: passed ? 'pass' : 'fail',
    details: {
      conditionFailed: passed ? null : 'float_switch_low',
      currentPVs: { floatSwitch: false },
      affectedCommand: 'start_pump'
    },
    actionTaken: passed ? null : 'blocked_command',
    commandLogId: command.insertId
  });
  
  if (!passed) {
    await db.update(commandLog)
      .set({
        status: 'blocked',
        interlockCheckPassed: false,
        blockedByInterlockId: interlock.id,
        failureReason: 'Dry run protection: float switch indicates no liquid'
      })
      .where(eq(commandLog.id, command.insertId));
    return;
  }
}

// 3. Send to hardware
await db.update(commandLog)
  .set({ status: 'sent', sentAt: new Date() })
  .where(eq(commandLog.id, command.insertId));

// 4. Node acknowledges
await db.update(commandLog)
  .set({ status: 'acked', ackedAt: new Date() })
  .where(eq(commandLog.id, command.insertId));

// 5. Command completes
await db.update(commandLog)
  .set({
    status: 'succeeded',
    completedAt: new Date(),
    appliedValue: 'true',
    nodeResponse: {
      message: 'Pump started successfully'
    }
  })
  .where(eq(commandLog.id, command.insertId));
```

### Workflow 5: Store Telemetry Reading

```typescript
// 1. Insert into time-series table
await db.insert(telemetryReadings).values({
  timestamp: new Date(),
  endpointId: 2,
  tileId: tempSensor.insertId,
  valueNum: 18.5,
  unit: '°C',
  quality: 'good',
  source: 'hardware',
  batchId: 42
});

// 2. Update current value cache
await db.insert(endpointCurrent).values({
  endpointId: 2,
  timestamp: new Date(),
  valueFloat: 18.5,
  quality: 'good',
  source: 'hardware'
}).onDuplicateKeyUpdate({
  timestamp: new Date(),
  valueFloat: 18.5,
  quality: 'good',
  updatedAt: new Date()
});
```

---

## API Endpoint Patterns

### GET /api/os/nodes
List all controller nodes with status

### GET /api/os/nodes/:nodeId/endpoints
List all endpoints for a node

### GET /api/os/tiles
List all device tiles (for canvas rendering)

### GET /api/os/tiles/:tileId
Get single tile with bindings and current values

### POST /api/os/command
Send command to device (with interlock checking)

### GET /api/os/telemetry/:endpointId
Get time-series data for endpoint

### GET /api/os/telemetry/current
Get current values for all endpoints (fast cache)

### GET /api/os/interlocks
List active interlocks

### GET /api/os/alarms
List active alarms

---

## Next Steps

1. ✅ Phase 1: Schema design complete
2. ✅ Phase 2: Drizzle schema implementation complete
3. ⏳ Phase 3: Create API endpoints
4. ⏳ Phase 4: Build seed data for testing
5. ⏳ Phase 5: Implement WebSocket for real-time updates
6. ⏳ Phase 6: Build Control Panel UI components

---

## TypeScript Types

All Drizzle schema definitions automatically generate TypeScript types:

```typescript
import { controllerNodes, hardwareEndpoints, deviceTiles } from '@/server/db/schema';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Select types (reading from DB)
type ControllerNode = InferSelectModel<typeof controllerNodes>;
type HardwareEndpoint = InferSelectModel<typeof hardwareEndpoints>;
type DeviceTile = InferSelectModel<typeof deviceTiles>;

// Insert types (writing to DB)
type NewControllerNode = InferInsertModel<typeof controllerNodes>;
type NewHardwareEndpoint = InferInsertModel<typeof hardwareEndpoints>;
type NewDeviceTile = InferInsertModel<typeof deviceTiles>;
```

---

## Performance Considerations

### Telemetry Storage
- Use `endpoint_current` for UI display (fast)
- Query `telemetry_readings` for charts/history
- Consider downsampling old data (90 days → hourly averages)

### Indexing
- All critical query patterns have indexes
- Composite index on (endpointId, timestamp) for time-series queries
- Correlation ID index for tracing related commands

### Partitioning (Future)
- When moving to Postgres, partition `telemetry_readings` by month
- Archive old `command_log` entries after 1 year

---

## Security Notes

- All commands logged with user attribution
- Interlock evaluations provide audit trail
- Safety interlocks cannot be bypassed without explicit override
- E-stop state requires manual acknowledgment
- Command correlation IDs enable forensic analysis
