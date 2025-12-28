# BevForge OS Control Panel - Database Schema Design (v2)

## Overview
This document defines the complete database schema for the OS Control Panel system, including device tiles, hardware endpoints, telemetry, safety interlocks, and audit logging.

## Design Principles
1. **Separation of Concerns**: Device configuration (layout) vs runtime state (telemetry)
2. **Hardware Abstraction**: Tiles reference hardware endpoints, not physical pins directly
3. **Extensibility**: JSON fields for device-specific configurations
4. **Safety First**: Interlock rules stored and enforced with full explainability
5. **Audit Everything**: Complete command/response logging with correlation IDs
6. **Time-Series Ready**: Telemetry tables optimized for time-series queries + current value cache
7. **Control Module Ready**: Virtual outputs and computed signals for future automation

---

## Table Definitions

### 1. `controller_nodes`
**Purpose**: Physical hardware controllers (Raspberry Pi, Arduino, ESP32, etc.)

```typescript
interface ControllerNode {
  id: number;
  nodeId: string;              // Unique identifier (e.g., "pi-brewhouse-01")
  name: string;                // Human-readable name
  nodeType: string;            // "raspberry_pi", "esp32", "arduino", "io_hub"
  ipAddress: string | null;    // Network address
  macAddress: string | null;   // Hardware MAC
  firmwareVersion: string | null;
  
  // Status
  status: 'online' | 'offline' | 'fault' | 'maintenance';
  lastSeen: Date | null;       // Last heartbeat
  lastHeartbeat: Date | null;  // Last successful ping
  
  // Capabilities
  capabilities: {
    digitalOutputs?: number;   // Number of digital output channels
    digitalInputs?: number;    // Number of digital input channels
    pwmOutputs?: number;       // Number of PWM-capable outputs
    analogInputs?: number;     // Number of analog input channels
    oneWireBus?: boolean;      // DS18B20 support
    i2cBus?: boolean;          // I2C device support
    spiBus?: boolean;          // SPI device support
    bleBluetooth?: boolean;    // BLE support (for Tilt)
  };
  
  // Configuration
  config: {
    pollingIntervalMs?: number;
    timeoutMs?: number;
    retryAttempts?: number;
    failsafeMode?: 'all_off' | 'hold_last' | 'custom';
  };
  
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: `nodeId` (unique), `status`, `isActive`

---

### 2. `hardware_endpoints`
**Purpose**: Individual I/O channels on controller nodes

```typescript
interface HardwareEndpoint {
  id: number;
  controllerId: number;        // FK to controller_nodes
  channelId: string;           // Physical identifier ("GPIO17", "PIN_A0", "1WIRE_0")
  
  // Capability metadata (critical for UI rendering)
  endpointKind: EndpointKind;
  valueType: 'bool' | 'int' | 'float' | 'string' | 'json';
  direction: 'input' | 'output' | 'bidirectional';
  
  // Units and scaling
  unit: string | null;         // "°C", "SG", "L/min", "psi", etc.
  rangeMin: number | null;     // For analog/PWM
  rangeMax: number | null;
  scale: number | null;        // Raw → engineering units
  offset: number | null;
  invert: boolean;             // Super common for relays/float switches
  
  // Timing
  samplePeriodMs: number | null; // For sensors
  
  // Output behavior
  writeMode: 'latched' | 'momentary' | 'pulse' | null; // For outputs
  pulseDurationMs: number | null; // If writeMode = pulse
  
  // Safety
  failsafeValue: number | boolean | string | null; // What to do if node offline
  
  // Configuration (endpoint-specific)
  config: {
    // Digital output
    invertLogic?: boolean;     // True = active low
    
    // PWM output
    pwmFrequencyHz?: number;
    pwmResolutionBits?: number;
    
    // Analog input
    adcResolutionBits?: number;
    voltageRangeMin?: number;
    voltageRangeMax?: number;
    
    // Pulse input (flow meter)
    pulsesPerUnit?: number;    // Pulses per gallon/liter
    debounceMs?: number;
    
    // Temperature sensor
    sensorAddress?: string;    // 1-Wire address
    offsetCalibration?: number;
    
    // BLE device
    bleAddress?: string;       // MAC address
    bleServiceUuid?: string;
    
    // Modbus
    modbusAddress?: number;
    modbusRegister?: number;
    modbusFunction?: number;
  };
  
  // Status
  status: 'ok' | 'fault' | 'disconnected' | 'calibrating';
  lastRead: Date | null;
  lastWrite: Date | null;
  
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type EndpointKind = 
  | 'DI'           // Digital input
  | 'DO'           // Digital output
  | 'AI'           // Analog input
  | 'AO'           // Analog output
  | 'PWM'          // PWM output
  | 'I2C'          // I2C device
  | 'SPI'          // SPI device
  | 'UART'         // UART/serial device
  | '1WIRE'        // 1-Wire (DS18B20)
  | 'MODBUS'       // Modbus RTU/TCP
  | 'VIRTUAL';     // Computed/soft endpoint
```

**Indexes**: `controllerId`, `endpointKind`, `status`, `isActive`

---

### 3. `endpoint_current`
**Purpose**: Fast-access cache of current endpoint values (avoids querying time-series table)

```typescript
interface EndpointCurrent {
  endpointId: number;          // PK, FK to hardware_endpoints
  timestamp: Date;             // When value was last updated
  
  // Value (use appropriate column based on valueType)
  valueBool: boolean | null;
  valueInt: number | null;
  valueFloat: number | null;
  valueString: string | null;
  valueJson: any | null;
  
  // Quality
  quality: 'good' | 'uncertain' | 'bad';
  qualityReason: string | null;
  
  // Source
  source: 'hardware' | 'derived' | 'manual' | 'sim';
  
  updatedAt: Date;
}
```

**Indexes**: `endpointId` (unique primary key)

---

### 4. `device_tiles`
**Purpose**: Virtual devices on the control panel canvas

```typescript
interface DeviceTile {
  id: number;
  tileId: string;              // Unique identifier ("vessel-fv01", "pump-p1")
  name: string;                // Display name
  tileType: TileType;
  
  // Canvas position (for Device Layout page)
  positionX: number | null;
  positionY: number | null;
  width: number | null;        // Tile dimensions
  height: number | null;
  
  // Visual
  iconName: string | null;     // Lucide icon name
  colorTheme: string | null;   // Color override
  
  // Type-specific configuration
  config: TileConfig;          // JSON - see TileConfig types below
  
  // Status
  status: 'operational' | 'warning' | 'error' | 'offline' | 'maintenance';
  
  // Grouping
  groupId: number | null;      // FK to device_groups (for manifolds, etc.)
  parentTileId: number | null; // For nested tiles (sensor inside vessel)
  
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type TileType =
  | 'vessel'           // Fermenter, brite, tote, keg
  | 'temp_sensor'      // DS18B20 probe
  | 'gravity_sensor'   // Tilt hydrometer
  | 'flow_meter'       // Hall-effect flow meter
  | 'pump'             // Transfer pump
  | 'valve'            // Solenoid or motorized valve
  | 'relay_ssr'        // Generic relay/SSR output
  | 'digital_input'    // Switch, float, e-stop
  | 'analog_input'     // Generic analog sensor
  | 'virtual_output'   // Computed/control signal (0-100%, on/off, PWM duty)
  | 'status_tile';     // UI tile for alarms, interlocks, node status

// Type-specific configurations
type TileConfig = 
  | VesselConfig
  | TempSensorConfig
  | GravitySensorConfig
  | FlowMeterConfig
  | PumpConfig
  | ValveConfig
  | RelaySSRConfig
  | DigitalInputConfig
  | AnalogInputConfig
  | VirtualOutputConfig
  | StatusTileConfig;

interface VesselConfig {
  vesselType: 'fermenter' | 'brite' | 'tote' | 'keg' | 'barrel' | 'generic';
  capacity: number;
  capacityUnit: string;
  
  // Associated sensors (FK to device_tiles)
  primaryTempSensorId?: number;
  secondaryTempSensorId?: number;
  gravitySensorId?: number;
  levelSensorId?: number;
  pressureSensorId?: number;
  phSensorId?: number;
  
  // Associated actuators (FK to device_tiles or virtual_outputs)
  coolingOutputId?: number;    // SSR/relay/virtual for cooling
  heatingOutputId?: number;    // SSR/relay/virtual for heating
  mixerOutputId?: number;      // Agitator/mixer
  
  // Virtual PID data (stored but not used by OS - for Control module)
  pidConfig?: {
    enabled: boolean;
    mode: 'off' | 'manual' | 'auto';
    setpoint?: number;
    manualOutput?: number;     // If in manual mode
    kp?: number;
    ki?: number;
    kd?: number;
    outputMin?: number;
    outputMax?: number;
    outputClampMin?: number;
    outputClampMax?: number;
    cycleTimeSeconds?: number;
    minOnTimeSeconds?: number;
    minOffTimeSeconds?: number;
    integratorHold?: boolean;  // Useful later
    direction?: 'direct' | 'reverse'; // Heating vs cooling
  };
  
  // Alarm thresholds
  alarms?: {
    tempHighC?: number;
    tempLowC?: number;
    pressureHighPsi?: number;
    levelLowPct?: number;
  };
}

interface TempSensorConfig {
  sensorType: 'ds18b20' | 'thermocouple' | 'rtd' | 'analog';
  unit: 'C' | 'F';
  offsetCalibration?: number;
  smoothingWindow?: number;    // Number of readings to average
  alarmHighC?: number;
  alarmLowC?: number;
}

interface GravitySensorConfig {
  sensorType: 'tilt' | 'ispindel' | 'manual';
  color?: string;              // Tilt color (red, green, etc.)
  smoothingWindow?: number;
  calibrationPoints?: Array<{  // Calibration curve
    raw: number;
    actual: number;
  }>;
}

interface FlowMeterConfig {
  meterType: 'hall_effect' | 'turbine' | 'paddlewheel';
  pulsesPerUnit: number;
  unit: 'gal' | 'L';
  totalizer: {
    sessionTotal: number;
    lifetimeTotal: number;
  };
}

interface PumpConfig {
  pumpType: 'centrifugal' | 'diaphragm' | 'peristaltic' | 'gear';
  hasSpeedControl: boolean;    // PWM/VFD capable
  isReversible: boolean;
  
  // Flow path
  sourceVesselId?: number;     // FK to vessel tile
  destVesselId?: number;       // FK to vessel tile
  flowMeterId?: number;        // FK to flow meter tile
  
  // Associated valves (for line selection)
  valveIds?: number[];         // FK to valve tiles
  
  // Safety
  maxRunTimeSeconds?: number;  // Auto-shutoff
  dryRunProtection?: boolean;
}

interface ValveConfig {
  valveType: 'solenoid' | 'motorized' | 'pneumatic';
  isProportional: boolean;     // 0-100% control
  
  // Manifold
  manifoldGroupId?: number;    // FK to device_groups
  mutualExclusion?: boolean;   // Only one valve open at a time
  
  // Position feedback
  hasPositionSensor: boolean;
  openTimeoutSeconds?: number;
  closeTimeoutSeconds?: number;
}

interface RelaySSRConfig {
  outputType: 'relay' | 'ssr';
  isPwmCapable: boolean;
  
  // Load info
  loadType?: 'heater' | 'cooler' | 'pump' | 'solenoid' | 'light' | 'fan' | 'other';
  loadWatts?: number;
  loadAmps?: number;
  
  // PWM settings (if SSR)
  pwmFrequencyHz?: number;
  minDutyCycle?: number;
  maxDutyCycle?: number;
  
  // Protection
  minOnTimeSeconds?: number;
  minOffTimeSeconds?: number;
}

interface DigitalInputConfig {
  inputType: 'switch' | 'float' | 'door' | 'estop' | 'limit' | 'proximity';
  normalState: 'open' | 'closed'; // Normal operating state
  invertLogic: boolean;
  debounceMs: number;
  
  // For safety interlocks
  isSafetyInput: boolean;
  safetyAction?: 'estop_all' | 'stop_group' | 'alarm_only';
}

interface AnalogInputConfig {
  sensorType: 'pressure' | 'level' | 'ph' | 'voltage' | 'current' | 'generic';
  unit: string;
  
  // Scaling
  rawMin: number;
  rawMax: number;
  scaledMin: number;
  scaledMax: number;
  
  // Alarms
  alarmHigh?: number;
  alarmLow?: number;
}

interface VirtualOutputConfig {
  // Virtual output = computed/control signal (not hardware)
  // Huge for: mirrored outputs, split control, simulation, Control module migration
  outputType: 'computed' | 'mirrored' | 'split' | 'simulated';
  valueType: 'bool' | 'float' | 'int';
  unit: string | null;
  rangeMin?: number;
  rangeMax?: number;
  
  // Computation
  computeExpression?: string;  // Formula or logic
  sourceInputIds?: number[];   // FK to other tiles (for mirroring/splitting)
  
  // Target endpoints (this virtual output feeds these)
  targetEndpointIds?: number[]; // FK to hardware_endpoints
  
  // Split control (e.g., 0-50% → output A, 50-100% → output B)
  splitRanges?: Array<{
    min: number;
    max: number;
    targetEndpointId: number;
    scale?: number;
    offset?: number;
  }>;
}

interface StatusTileConfig {
  // UI tile that binds to alarms, interlock states, node status, boolean expressions
  // Prevents hacking "vessel tile shows alarm" forever
  displayType: 'alarm_summary' | 'interlock_status' | 'node_health' | 'custom_expression';
  
  // Sources
  alarmTileIds?: number[];     // FK to device_tiles (show alarms from these)
  interlockIds?: number[];     // FK to safety_interlocks (show status)
  nodeIds?: number[];          // FK to controller_nodes (show online/offline)
  
  // Custom expression
  expression?: string;         // Boolean logic ("(input1 AND input2) OR NOT input3")
  
  // Display
  showSeverity?: boolean;
  showTimestamp?: boolean;
  autoAcknowledge?: boolean;
}
```

**Indexes**: `tileId` (unique), `tileType`, `status`, `groupId`, `parentTileId`, `isActive`

---

### 5. `tile_endpoint_bindings`
**Purpose**: Map device tiles to hardware endpoints (supports multi-bind, direction, transforms)

```typescript
interface TileEndpointBinding {
  id: number;
  tileId: number;              // FK to device_tiles
  endpointId: number;          // FK to hardware_endpoints
  
  // Binding semantics
  bindingRole: BindingRole;    // What this binding represents
  direction: 'read' | 'write' | 'bidirectional';
  
  // For tiles with multiple endpoints
  role: string | null;         // "primary_temp", "cooling_output", "inlet_valve"
  
  // Scaling/transformation per binding
  transform: {
    scale?: number;
    offset?: number;
    invert?: boolean;
    clamp?: { min: number; max: number };
    deadband?: number;         // Ignore changes smaller than this
    smoothing?: number;        // Moving average window
    mapTable?: Array<{ input: number; output: number }>; // Lookup table
    formula?: string;          // For complex transformations
    debounceMs?: number;
  } | null;
  
  // Priority (when multiple bindings exist)
  priority: number;            // Higher = more important
  order: number;               // Execution order
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type BindingRole = 
  | 'pv'           // Process value (sensor reading)
  | 'sp'           // Setpoint
  | 'output'       // Control output
  | 'state'        // Device state (on/off, open/closed)
  | 'alarm'        // Alarm condition
  | 'permissive';  // Permissive interlock input
```

**Indexes**: `tileId`, `endpointId`, `bindingRole`, `direction`, `isActive`
**Unique Constraint**: `(tileId, endpointId, role)`

---

### 6. `device_groups`
**Purpose**: Logical grouping of devices (manifolds, process zones, safety zones, layout groups)

```typescript
interface DeviceGroup {
  id: number;
  name: string;
  groupType: GroupType;        // Clarify what this group represents
  
  // Rules
  rules: {
    mutualExclusion?: boolean;   // Only one device active at a time (manifolds)
    sequenceRequired?: boolean;  // Devices must activate in order
    interlockGroupId?: number;   // FK to another group
  };
  
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type GroupType = 
  | 'layout'         // Canvas grouping (purely UI: move together)
  | 'safety_zone'    // Interlocks apply within zone
  | 'manifold'       // Mutual exclusion group (only one valve open)
  | 'batch_area'     // Process area for batch tracking
  | 'custom';        // User-defined
```

**Indexes**: `groupType`, `isActive`

---

### 7. `system_safety_state`
**Purpose**: System-wide safety state (E-stop, global interlocks)

```typescript
interface SystemSafetyState {
  id: number;                  // Single row per system/site
  siteId: string;              // "brewhouse", "cellar", "packaging"
  
  // E-stop state
  estopActive: boolean;
  estopSource: string | null;  // Which DI endpoint triggered it
  estopActivatedAt: Date | null;
  estopLatched: boolean;       // Requires manual reset
  
  // Global safety mode
  safetyMode: 'normal' | 'restricted' | 'maintenance' | 'emergency';
  
  // Acknowledgment
  ackRequired: boolean;
  ackedBy: string | null;
  ackedAt: Date | null;
  
  notes: string | null;
  updatedAt: Date;
}
```

**Indexes**: `siteId` (unique)

---

### 8. `system_safety_log`
**Purpose**: Log of system safety state transitions

```typescript
interface SystemSafetyLog {
  id: number;
  timestamp: Date;
  siteId: string;
  
  // Transition
  previousState: string;       // Previous safetyMode or estop state
  newState: string;
  
  // Cause
  triggeredBy: string;         // "estop_button_1", "user:john", "interlock_5"
  reason: string;
  
  // Action taken
  actionsTaken: string[];      // ["all_outputs_off", "pumps_stopped", "alarms_triggered"]
  
  createdAt: Date;
}
```

**Indexes**: `timestamp` (DESC), `siteId`

---

### 9. `telemetry_readings`
**Purpose**: Time-series process values (temperatures, gravity, flow, etc.)

```typescript
interface TelemetryReading {
  id: number;
  timestamp: Date;             // Reading timestamp
  endpointId: number;          // FK to hardware_endpoints
  tileId: number | null;       // FK to device_tiles (optional, for computed vessel temp)
  
  // Value (use appropriate column based on valueType)
  valueBool: boolean | null;
  valueNum: number | null;     // For int/float (don't put everything in JSON)
  valueString: string | null;
  valueJson: any | null;
  
  // Metadata
  unit: string | null;
  
  // Quality
  quality: 'good' | 'uncertain' | 'bad';
  qualityReason: string | null; // "sensor_fault", "out_of_range", etc.
  
  // Source
  source: 'hardware' | 'derived' | 'manual' | 'sim';
  
  // Context
  batchId: number | null;      // FK to batches (if applicable)
  
  createdAt: Date;             // When record was inserted
}
```

**Indexes**: 
- `(endpointId, timestamp DESC)` - Primary query pattern
- `timestamp` (DESC) - Time-range queries
- `tileId` - Tile-based queries
- `batchId` - Batch-based queries
- `quality` - Filter by quality

**Partitioning Strategy**: Monthly partitioning when moving to Postgres

---

### 10. `command_log`
**Purpose**: Audit log of all manual commands and automation actions (with full lifecycle)

```typescript
interface CommandLog {
  id: number;
  commandId: string;           // UUID for this specific command
  correlationId: string;       // Same for all commands from one "button click"
  
  // Timing (full lifecycle)
  requestedAt: Date;
  sentAt: Date | null;
  ackedAt: Date | null;
  completedAt: Date | null;
  
  // Command details
  commandType: 'manual' | 'automation' | 'safety' | 'system';
  action: string;              // "set_output", "start_pump", "open_valve", "estop"
  
  // Target
  targetTileId: number | null;       // FK to device_tiles
  targetEndpointId: number | null;   // FK to hardware_endpoints
  
  // Command data
  requestedValue: number | boolean | string | null;
  appliedValue: number | boolean | string | null;
  previousValue: number | boolean | string | null;
  
  commandData: {
    duration?: number;         // For timed operations
    reason?: string;
    parameters?: any;          // Additional params
  } | null;
  
  // Result
  status: 'queued' | 'sent' | 'acked' | 'succeeded' | 'failed' | 'blocked';
  failureReason: string | null; // "interlock_active", "device_offline", etc.
  
  // Attribution
  requestedByUserId: string | null;   // User ID
  requestedByService: string | null;  // "control_panel", "api", "recipe_step"
  
  // Safety
  interlockCheckPassed: boolean;
  blockedByInterlockId: number | null; // FK to safety_interlocks
  interlockDetails: string | null;
  
  // Node response
  nodeResponse: {
    errorCode?: string;
    message?: string;
    rawResponse?: any;
  } | null;
  
  notes: string | null;
  createdAt: Date;
}
```

**Indexes**: 
- `requestedAt` (DESC) - Time-based queries
- `correlationId` - Trace related commands
- `commandId` (unique) - Direct lookup
- `status` - Filter by status
- `targetTileId` - Tile-based queries
- `requestedByUserId` - User audit

---

### 11. `safety_interlocks`
**Purpose**: Define safety rules that can block commands (with full action types)

```typescript
interface SafetyInterlock {
  id: number;
  name: string;
  description: string;
  
  // Scope
  interlockType: 'estop' | 'permissive' | 'conditional' | 'timer';
  mode: 'permissive' | 'trip' | 'advisory';
  priority: number;            // Higher = more critical
  
  // Condition
  condition: {
    // Input-based
    inputTileId?: number;      // FK to device_tiles (digital input)
    requiredState?: boolean;   // Required state to allow action
    
    // State-based
    targetTileId?: number;     // Tile being protected
    targetState?: string;      // "must_be_off", "must_be_closed"
    
    // Timer-based
    minOffTimeSeconds?: number;
    minOnTimeSeconds?: number;
    
    // Complex logic (future)
    expression?: string;       // "(input1 AND input2) OR NOT input3"
  };
  
  // Action
  affectedTiles: number[];     // FK array to device_tiles
  blockActions: string[];      // ["turn_on", "open", "start"]
  
  // Response
  onViolationAction: 'block' | 'force_off' | 'force_value' | 'latch_until_ack';
  forceValue: number | boolean | null; // If onViolationAction = force_value
  alarmMessage: string | null;
  
  // Latching and acknowledgment
  latched: boolean;            // Stays active until manually cleared
  ackRequired: boolean;        // Requires operator acknowledgment
  
  // Severity
  severity: 'info' | 'warning' | 'critical';
  
  // Status
  isActive: boolean;
  lastTriggered: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: `interlockType`, `mode`, `priority`, `severity`, `isActive`

---

### 12. `interlock_evaluations`
**Purpose**: Explainability log - "who blocked it, why, when, what did we do instead?"

```typescript
interface InterlockEvaluation {
  id: number;
  interlockId: number;         // FK to safety_interlocks
  evaluatedAt: Date;
  
  // Result
  result: 'pass' | 'fail';
  
  // Details (explainability)
  details: {
    conditionFailed?: string;  // Which condition failed
    currentPVs?: Record<string, number | boolean>; // Current process values
    thresholds?: Record<string, number | boolean>; // Thresholds checked
    involvedBindings?: number[]; // FK to tile_endpoint_bindings
    affectedCommand?: string;  // Command that was blocked
  };
  
  // Action taken
  actionTaken: string | null;  // "blocked_command", "forced_output_off", "alarm_triggered"
  
  // Context
  commandLogId: number | null; // FK to command_log (if blocking a command)
  
  createdAt: Date;
}
```

**Indexes**: `interlockId`, `evaluatedAt` (DESC), `result`, `commandLogId`

---

### 13. `device_state_history`
**Purpose**: Track state changes for devices (on/off, open/closed, etc.)

```typescript
interface DeviceStateHistory {
  id: number;
  timestamp: Date;
  tileId: number;              // FK to device_tiles
  
  // State change
  previousState: string | number | boolean;
  newState: string | number | boolean;
  
  // Context
  changeReason: 'manual' | 'automation' | 'safety' | 'timeout' | 'fault';
  commandLogId: number | null; // FK to command_log
  
  // Duration tracking
  durationSeconds: number | null; // How long previous state lasted
  
  createdAt: Date;
}
```

**Indexes**: `timestamp` (DESC), `tileId`, `changeReason`

---

### 14. `alarm_events`
**Purpose**: Track alarm conditions and acknowledgments

```typescript
interface AlarmEvent {
  id: number;
  timestamp: Date;
  
  // Source
  tileId: number | null;       // FK to device_tiles
  endpointId: number | null;   // FK to hardware_endpoints
  alarmType: 'high' | 'low' | 'fault' | 'offline' | 'safety' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  
  // Details
  message: string;
  value: number | string | null; // Actual value that triggered alarm
  threshold: number | string | null; // Threshold that was exceeded
  
  // Status
  status: 'active' | 'acknowledged' | 'cleared' | 'suppressed';
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  clearedAt: Date | null;
  
  // Context
  batchId: number | null;      // FK to batches
  
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**: `timestamp` (DESC), `tileId`, `endpointId`, `status`, `severity`, `alarmType`

---

## Relationships Summary

```
controller_nodes (1) ──→ (N) hardware_endpoints

hardware_endpoints (1) ──→ (1) endpoint_current

device_tiles (1) ──→ (N) tile_endpoint_bindings ←── (N) hardware_endpoints
device_tiles (1) ──→ (N) telemetry_readings
device_tiles (1) ──→ (N) command_log
device_tiles (1) ──→ (N) device_state_history
device_tiles (1) ──→ (N) alarm_events

device_tiles (N) ──→ (1) device_groups
device_tiles (N) ──→ (1) device_tiles (parent/child)

safety_interlocks (1) ──→ (N) interlock_evaluations
safety_interlocks (N) ──→ (N) device_tiles (affected tiles)

command_log (1) ──→ (N) interlock_evaluations

batches (1) ──→ (N) telemetry_readings
batches (1) ──→ (N) alarm_events

system_safety_state (1) ──→ (N) system_safety_log
```

---

## Migration Strategy

1. **Phase 1a**: Create controller_nodes, hardware_endpoints, endpoint_current tables
2. **Phase 1b**: Create device_tiles, tile_endpoint_bindings tables
3. **Phase 1c**: Create device_groups, system_safety_state, system_safety_log tables
4. **Phase 1d**: Create telemetry_readings, command_log tables
5. **Phase 1e**: Create safety_interlocks, interlock_evaluations tables
6. **Phase 1f**: Create device_state_history, alarm_events tables

---

## Data Retention Policies

- **telemetry_readings**: Keep 90 days at full resolution, then downsample to hourly averages
- **command_log**: Keep 1 year, then archive
- **device_state_history**: Keep 1 year, then archive
- **alarm_events**: Keep indefinitely (or until acknowledged + 1 year)
- **interlock_evaluations**: Keep 1 year, then archive
- **endpoint_current**: Always current (single row per endpoint)

---

## Key Improvements from v1

### ✅ Added:
1. **`virtual_output` tile type** - Computed/control signals for Control module
2. **`status_tile` tile type** - UI tiles for alarms/interlocks/status
3. **`endpoint_current` table** - Fast-access cache for current values
4. **Endpoint capability metadata** - `endpointKind`, `valueType`, `unit`, `rangeMin/Max`, `scale/offset`, `invert`, `samplePeriodMs`, `writeMode`, `failsafeValue`
5. **Multi-bind support** - `bindingRole`, `direction`, `transform` per binding
6. **`interlock_evaluations` table** - Explainability for blocked commands
7. **Command lifecycle** - `commandId`, `correlationId`, full timing (requested → sent → acked → completed)
8. **E-stop system state** - `system_safety_state` + `system_safety_log` tables
9. **Group type clarification** - `layout` vs `safety_zone` vs `manifold` vs `batch_area`
10. **Telemetry improvements** - `source`, `valueBool`/`valueNum` columns, better indexing
11. **Safety interlock enhancements** - `mode`, `onViolationAction`, `latched`, `ackRequired`, `severity`
12. **PID mode fields** - `mode`, `manualOutput`, `outputClamp`, `integratorHold`, `direction`

---

## Next Steps

1. ✅ Review this schema design (v2)
2. ⏳ Implement Drizzle schema definitions
3. ⏳ Generate and run migrations
4. ⏳ Create TypeScript types
5. ⏳ Build seed data for testing
