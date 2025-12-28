# BevForge OS Control Panel - Implementation Roadmap

## Current Status: Phase 2 Complete ✅

---

## Phase 1: Schema Design ✅ COMPLETE

**Status:** Complete

**Deliverables:**
- ✅ OS-CONTROL-SCHEMA-DESIGN.md (comprehensive schema design)
- ✅ 25 tables designed (11 inventory + 14 control panel)
- ✅ All design questions answered
- ✅ OS-DESIGN-DECISIONS.md (architectural decisions)

---

## Phase 2: Drizzle Schema Implementation ✅ COMPLETE

**Status:** Complete

**Deliverables:**
- ✅ `src/server/db/schema.ts` updated with all 25 tables
- ✅ Migration generated: `drizzle/0001_gifted_doctor_octopus.sql`
- ✅ Migration applied successfully
- ✅ TypeScript types auto-generated
- ✅ OS-MODULE-GUIDE.md (usage guide)

**Tables Implemented:**
- ✅ controller_nodes
- ✅ hardware_endpoints
- ✅ endpoint_current
- ✅ device_tiles
- ✅ tile_endpoint_bindings
- ✅ device_groups
- ✅ system_safety_state
- ✅ system_safety_log
- ✅ telemetry_readings
- ✅ command_log
- ✅ safety_interlocks
- ✅ interlock_evaluations
- ✅ device_state_history
- ✅ alarm_events

---

## Phase 3: API Endpoints ⏳ NEXT

**Goal:** Create REST API for OS Control Panel operations

### 3.1: Controller Node Management

**Endpoints:**
- `GET /api/os/nodes` - List all controller nodes
- `GET /api/os/nodes/:nodeId` - Get single node with details
- `POST /api/os/nodes` - Register new controller node
- `PUT /api/os/nodes/:nodeId` - Update node configuration
- `DELETE /api/os/nodes/:nodeId` - Remove node
- `GET /api/os/nodes/:nodeId/endpoints` - List endpoints for node
- `POST /api/os/nodes/:nodeId/heartbeat` - Update node heartbeat

**Files to Create:**
- `src/server/api/os/nodes/GET.ts`
- `src/server/api/os/nodes/POST.ts`
- `src/server/api/os/nodes/[nodeId]/GET.ts`
- `src/server/api/os/nodes/[nodeId]/PUT.ts`
- `src/server/api/os/nodes/[nodeId]/DELETE.ts`
- `src/server/api/os/nodes/[nodeId]/endpoints/GET.ts`
- `src/server/api/os/nodes/[nodeId]/heartbeat/POST.ts`

### 3.2: Hardware Endpoints Management

**Endpoints:**
- `GET /api/os/endpoints` - List all endpoints (with filters)
- `GET /api/os/endpoints/:endpointId` - Get single endpoint
- `POST /api/os/endpoints` - Create new endpoint
- `PUT /api/os/endpoints/:endpointId` - Update endpoint
- `DELETE /api/os/endpoints/:endpointId` - Remove endpoint

**Files to Create:**
- `src/server/api/os/endpoints/GET.ts`
- `src/server/api/os/endpoints/POST.ts`
- `src/server/api/os/endpoints/[endpointId]/GET.ts`
- `src/server/api/os/endpoints/[endpointId]/PUT.ts`
- `src/server/api/os/endpoints/[endpointId]/DELETE.ts`

### 3.3: Device Tiles Management

**Endpoints:**
- `GET /api/os/tiles` - List all tiles (for canvas rendering)
- `GET /api/os/tiles/:tileId` - Get single tile with bindings
- `POST /api/os/tiles` - Create new tile
- `PUT /api/os/tiles/:tileId` - Update tile (position, config)
- `DELETE /api/os/tiles/:tileId` - Remove tile
- `GET /api/os/tiles/:tileId/bindings` - Get tile bindings
- `POST /api/os/tiles/:tileId/bindings` - Add binding
- `DELETE /api/os/tiles/:tileId/bindings/:bindingId` - Remove binding

**Files to Create:**
- `src/server/api/os/tiles/GET.ts`
- `src/server/api/os/tiles/POST.ts`
- `src/server/api/os/tiles/[tileId]/GET.ts`
- `src/server/api/os/tiles/[tileId]/PUT.ts`
- `src/server/api/os/tiles/[tileId]/DELETE.ts`
- `src/server/api/os/tiles/[tileId]/bindings/GET.ts`
- `src/server/api/os/tiles/[tileId]/bindings/POST.ts`
- `src/server/api/os/tiles/[tileId]/bindings/[bindingId]/DELETE.ts`

### 3.4: Command Execution (CRITICAL)

**Endpoints:**
- `POST /api/os/command` - Execute command with interlock checking
- `GET /api/os/command/:commandId` - Get command status
- `GET /api/os/command/history` - Get command history
- `POST /api/os/command/:commandId/ack` - Acknowledge command (from node)
- `POST /api/os/command/:commandId/complete` - Mark command complete (from node)

**Files to Create:**
- `src/server/api/os/command/POST.ts` (main command handler)
- `src/server/api/os/command/[commandId]/GET.ts`
- `src/server/api/os/command/[commandId]/ack/POST.ts`
- `src/server/api/os/command/[commandId]/complete/POST.ts`
- `src/server/api/os/command/history/GET.ts`

**Command Handler Logic:**
1. Validate command
2. Check safety interlocks (reactive)
3. Log interlock evaluations
4. If blocked: update command_log, return error
5. If allowed: forward to hardware node
6. Return command ID for tracking

### 3.5: Telemetry Ingestion & Queries

**Endpoints:**
- `POST /api/os/telemetry/ingest` - Ingest telemetry from nodes (batch)
- `GET /api/os/telemetry/current` - Get current values (fast cache)
- `GET /api/os/telemetry/:endpointId` - Get time-series data
- `GET /api/os/telemetry/tiles/:tileId` - Get telemetry for tile

**Files to Create:**
- `src/server/api/os/telemetry/ingest/POST.ts`
- `src/server/api/os/telemetry/current/GET.ts`
- `src/server/api/os/telemetry/[endpointId]/GET.ts`
- `src/server/api/os/telemetry/tiles/[tileId]/GET.ts`

**Telemetry Ingest Logic:**
1. Validate batch payload
2. Apply input transforms (scale, offset, clamp, smoothing)
3. Write to `telemetry_readings`
4. Update `endpoint_current` cache
5. Auto-associate with active batch (if applicable)
6. Return success/failure per reading

### 3.6: Safety Interlocks

**Endpoints:**
- `GET /api/os/interlocks` - List active interlocks
- `GET /api/os/interlocks/:interlockId` - Get single interlock
- `POST /api/os/interlocks` - Create new interlock
- `PUT /api/os/interlocks/:interlockId` - Update interlock
- `DELETE /api/os/interlocks/:interlockId` - Remove interlock
- `GET /api/os/interlocks/evaluations` - Get evaluation history

**Files to Create:**
- `src/server/api/os/interlocks/GET.ts`
- `src/server/api/os/interlocks/POST.ts`
- `src/server/api/os/interlocks/[interlockId]/GET.ts`
- `src/server/api/os/interlocks/[interlockId]/PUT.ts`
- `src/server/api/os/interlocks/[interlockId]/DELETE.ts`
- `src/server/api/os/interlocks/evaluations/GET.ts`

### 3.7: Alarms

**Endpoints:**
- `GET /api/os/alarms` - List active alarms
- `GET /api/os/alarms/:alarmId` - Get single alarm
- `POST /api/os/alarms/:alarmId/ack` - Acknowledge alarm
- `POST /api/os/alarms/:alarmId/clear` - Clear alarm (if manual)

**Files to Create:**
- `src/server/api/os/alarms/GET.ts`
- `src/server/api/os/alarms/[alarmId]/GET.ts`
- `src/server/api/os/alarms/[alarmId]/ack/POST.ts`
- `src/server/api/os/alarms/[alarmId]/clear/POST.ts`

### 3.8: System Safety State

**Endpoints:**
- `GET /api/os/safety/state` - Get current safety state
- `POST /api/os/safety/estop` - Trigger E-stop
- `POST /api/os/safety/reset` - Reset E-stop (with ack)
- `GET /api/os/safety/log` - Get safety state history

**Files to Create:**
- `src/server/api/os/safety/state/GET.ts`
- `src/server/api/os/safety/estop/POST.ts`
- `src/server/api/os/safety/reset/POST.ts`
- `src/server/api/os/safety/log/GET.ts`

---

## Phase 4: Seed Data ⏳ UPCOMING

**Goal:** Create realistic test data for development and testing

### 4.1: Sample Controller Nodes

**Create:**
- 2-3 mock controller nodes (Pi, ESP32)
- Various online/offline states
- Different capability profiles

### 4.2: Sample Hardware Endpoints

**Create:**
- GPIO digital outputs (relays, SSRs)
- GPIO digital inputs (switches, floats)
- 1-Wire temperature sensors
- Analog inputs (pressure, level)
- PWM outputs (pumps, valves)

### 4.3: Sample Device Tiles

**Create:**
- 2-3 vessels (fermenters, brites)
- Temperature sensors (bound to vessels)
- Gravity sensors (Tilt)
- Pumps with speed control
- Valves (solenoid, motorized)
- Virtual outputs (split control)

### 4.4: Sample Bindings

**Create:**
- Temp sensor → 1-Wire endpoint
- Pump → relay endpoint
- Valve → relay endpoint
- Virtual output → heater + cooler endpoints

### 4.5: Sample Interlocks

**Create:**
- Pump dry run protection (float switch)
- Vessel overpressure protection
- Manifold mutual exclusion
- Timer-based interlocks (min on/off times)

### 4.6: Sample Telemetry

**Create:**
- Historical temperature readings (last 7 days)
- Gravity readings (fermentation curve)
- Flow meter totals
- Pressure readings

**File to Create:**
- `src/server/db/seed-os-control.ts`

---

## Phase 5: Real-Time Updates ⏳ UPCOMING

**Goal:** Implement WebSocket for live telemetry and command status

### 5.1: WebSocket Server Setup

**Create:**
- WebSocket server integration with Vite
- Connection management
- Authentication/authorization

### 5.2: Telemetry Streaming

**Implement:**
- Subscribe to endpoint updates
- Subscribe to tile updates
- Batch updates for efficiency
- Throttling/debouncing

### 5.3: Command Status Updates

**Implement:**
- Real-time command lifecycle updates
- Correlation ID tracking
- Error notifications

### 5.4: Alarm Notifications

**Implement:**
- Real-time alarm triggers
- Alarm acknowledgment broadcasts
- Alarm clearing notifications

### 5.5: Proactive Interlock Evaluation

**Implement:**
- Background evaluation loop (250-1000ms)
- Trip interlock monitoring
- Automatic force-off actions
- Alarm triggers

---

## Phase 6: Control Panel UI ⏳ UPCOMING

**Goal:** Build React components for OS Control Panel

### 6.1: Device Canvas

**Features:**
- Drag-and-drop tile positioning
- Grid snapping
- Zoom/pan controls
- Connection lines between tiles
- Status indicators (operational, warning, error, offline)

**Components:**
- `DeviceCanvas.tsx` (main canvas)
- `DeviceTile.tsx` (individual tile)
- `TileConnector.tsx` (connection lines)

### 6.2: Tile Components

**Create tile-specific components:**
- `VesselTile.tsx` (with temp, gravity, status)
- `PumpTile.tsx` (with speed control, status)
- `ValveTile.tsx` (open/close, status)
- `SensorTile.tsx` (current value, trend)
- `VirtualOutputTile.tsx` (computed value)

### 6.3: Control Panel

**Features:**
- Real-time telemetry display
- Command buttons with interlock status
- Manual control interface
- Safety status indicators

**Components:**
- `ControlPanel.tsx` (main panel)
- `TelemetryDisplay.tsx` (live values)
- `CommandButton.tsx` (with interlock checking)
- `SafetyStatus.tsx` (E-stop, interlocks)

### 6.4: Alarm Management

**Features:**
- Active alarm list
- Alarm acknowledgment interface
- Alarm history
- Filtering/sorting

**Components:**
- `AlarmList.tsx`
- `AlarmCard.tsx`
- `AlarmAckButton.tsx`

### 6.5: Interlock Management

**Features:**
- Active interlock list
- Interlock configuration
- Evaluation history
- Explainability (why blocked)

**Components:**
- `InterlockList.tsx`
- `InterlockCard.tsx`
- `InterlockEvaluation.tsx`

### 6.6: Node Management

**Features:**
- Controller node list
- Node status (online/offline)
- Endpoint configuration
- Heartbeat monitoring

**Components:**
- `NodeList.tsx`
- `NodeCard.tsx`
- `EndpointList.tsx`

---

## Phase 7: Testing & Refinement ⏳ FUTURE

**Goal:** Comprehensive testing and bug fixes

### 7.1: Unit Tests

**Test:**
- API endpoint handlers
- Interlock evaluation logic
- Transform calculations
- Command lifecycle

### 7.2: Integration Tests

**Test:**
- End-to-end command flow
- Telemetry ingestion → display
- Interlock blocking
- Alarm triggering

### 7.3: Performance Testing

**Test:**
- High-frequency telemetry ingestion
- Large canvas with many tiles
- WebSocket connection limits
- Database query performance

### 7.4: User Acceptance Testing

**Test:**
- Real-world scenarios
- Usability feedback
- Edge cases
- Error handling

---

## Phase 8: Documentation ⏳ FUTURE

**Goal:** Complete user and developer documentation

### 8.1: User Documentation

**Create:**
- Control Panel user guide
- Device configuration guide
- Interlock setup guide
- Troubleshooting guide

### 8.2: Developer Documentation

**Create:**
- API reference
- Schema documentation
- Extension guide (custom tile types)
- Hardware node integration guide

### 8.3: Video Tutorials

**Create:**
- Getting started
- Creating your first device
- Setting up interlocks
- Monitoring telemetry

---

## Summary

### Completed
- ✅ Phase 1: Schema Design
- ✅ Phase 2: Drizzle Implementation

### Next Steps
- ⏳ Phase 3: API Endpoints (IMMEDIATE NEXT)
- ⏳ Phase 4: Seed Data
- ⏳ Phase 5: Real-Time Updates
- ⏳ Phase 6: Control Panel UI
- ⏳ Phase 7: Testing & Refinement
- ⏳ Phase 8: Documentation

### Estimated Timeline
- Phase 3: 2-3 days (API endpoints)
- Phase 4: 1 day (seed data)
- Phase 5: 2-3 days (WebSocket + proactive interlocks)
- Phase 6: 4-5 days (UI components)
- Phase 7: 2-3 days (testing)
- Phase 8: 1-2 days (documentation)

**Total: ~2-3 weeks for MVP**
