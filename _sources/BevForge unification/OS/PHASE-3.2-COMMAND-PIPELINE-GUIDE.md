# Phase 3.2: Command Pipeline - Implementation Guide

## ✅ Status: COMPLETE

**Date:** December 27, 2025
**Phase:** 3.2 - Command Pipeline
**Goal:** Single canonical command entry point with interlock evaluation and full lifecycle tracking

---

## 📁 Files Created

1. **`src/server/api/os/command/POST.ts`** (414 lines)
   - Single entry point for all hardware commands
   - Complete validation, interlock evaluation, lifecycle tracking
   - Mock node communication simulation
   - State updates on success

2. **`src/server/api/os/command/[commandId]/GET.ts`** (94 lines)
   - Query command status and lifecycle
   - Full timing information (requestedAt, sentAt, ackedAt, completedAt)

**Total:** 2 endpoint files, 508 lines of code

---

## 🔍 Endpoint Specifications

### 1. POST /api/os/command

**Purpose:** Single canonical command entry point

**Request Body:**
```json
{
  "endpointId": 10,
  "value": true,
  "commandType": "write",
  "tileId": 5,
  "correlationId": "batch-123",
  "requestedBy": "user@example.com"
}
```

**Fields:**
- `endpointId` (required): Target hardware endpoint ID
- `value` (required): Value to write (boolean | number | string | object)
- `commandType` (optional): "write" | "toggle" | "pulse" (default: "write")
- `tileId` (optional): Associated tile ID (for interlock evaluation)
- `correlationId` (optional): Group related commands (e.g., batch operations)
- `requestedBy` (optional): User/system identifier (default: "system")

**Command Types:**
- **write**: Set endpoint to specified value
- **toggle**: Flip boolean value (ignores provided value)
- **pulse**: Set true briefly then false (for momentary actions)

**Response (Success):**
```json
{
  "commandId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "succeeded",
  "message": "Command executed successfully",
  "actualValue": true
}
```

**Response (Blocked by Interlock):**
```json
{
  "commandId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "blocked",
  "message": "Interlock 'Temperature Safety': Value 150 outside allowed range [0, 100]",
  "interlockId": 3
}
```

**Response (Failed):**
```json
{
  "commandId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "message": "Node communication timeout"
}
```

**Status Codes:**
- `200` - Command succeeded
- `400` - Invalid request (missing fields, invalid commandType, read-only endpoint)
- `403` - Blocked by interlock
- `404` - Endpoint not found
- `500` - Internal error or node communication failure

---

### 2. GET /api/os/command/:commandId

**Purpose:** Query command status and lifecycle

**Response:**
```json
{
  "commandId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "succeeded",
  "endpointId": 10,
  "tileId": 5,
  "commandType": "write",
  "requestedValue": true,
  "actualValue": true,
  "requestedAt": "2025-12-27T10:30:00.000Z",
  "sentAt": "2025-12-27T10:30:00.050Z",
  "ackedAt": "2025-12-27T10:30:00.100Z",
  "completedAt": "2025-12-27T10:30:00.150Z",
  "requestedBy": "user@example.com",
  "correlationId": "batch-123",
  "errorMessage": null
}
```

**Status Values:**
- `queued` - Command accepted, waiting to send
- `sent` - Sent to hardware node
- `acked` - Node acknowledged receipt
- `succeeded` - Command completed successfully
- `failed` - Command failed (see errorMessage)
- `blocked` - Blocked by interlock (see errorMessage)

**Status Codes:**
- `200` - Command found
- `400` - Invalid commandId
- `404` - Command not found
- `500` - Internal error

---

## 🔄 Command Pipeline Flow

### Normal Flow (Success)

```
1. POST /api/os/command
   ↓
2. Validate request (endpointId, value, commandType)
   ↓
3. Check endpoint exists and is writable (DO, AO, PWM, VIRTUAL)
   ↓
4. Evaluate interlocks (query safety_interlocks table)
   ↓
5. Log to interlock_evaluations (passed/failed, condition, action)
   ↓
6. Insert to command_log (status=queued, generate UUID)
   ↓
7. Simulate node communication:
   - Update status: queued → sent (50ms delay)
   - Update status: sent → acked (50ms delay)
   - Update status: acked → succeeded
   ↓
8. Update endpoint_current (upsert)
   ↓
9. Insert to telemetry_readings (historical record)
   ↓
10. Return { commandId, status: "succeeded", actualValue }
```

### Blocked Flow (Interlock Violation)

```
1. POST /api/os/command
   ↓
2. Validate request
   ↓
3. Check endpoint exists and is writable
   ↓
4. Evaluate interlocks → VIOLATION DETECTED
   ↓
5. Log to interlock_evaluations (passed=false, failedCondition, actionTaken)
   ↓
6. Insert to command_log (status=blocked, errorMessage)
   ↓
7. Insert to alarm_events (status=active, severity, message)
   ↓
8. Return 403 { commandId, status: "blocked", message, interlockId }
```

### Failed Flow (Node Communication Error)

```
1. POST /api/os/command
   ↓
2-6. [Same as normal flow]
   ↓
7. Simulate node communication → ERROR
   ↓
8. Update command_log (status=failed, errorMessage)
   ↓
9. Return 500 { commandId, status: "failed", message }
```

---

## 🧪 Test Scenarios

### Scenario 1: Normal Write Command

**Setup:**
- Endpoint 10 exists (DO, active)
- No interlocks configured

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 10,
    "value": true,
    "commandType": "write",
    "requestedBy": "test-user"
  }'
```

**Expected:**
- Status: 200
- Response: `{ commandId, status: "succeeded", actualValue: true }`
- `command_log` entry: status=succeeded, all timestamps populated
- `endpoint_current` updated: valueBool=true, source="command"
- `telemetry_readings` entry: valueBool=true, source="command"

---

### Scenario 2: Toggle Command

**Setup:**
- Endpoint 10 exists (DO, active)
- Current value: false
- No interlocks

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 10,
    "value": false,
    "commandType": "toggle"
  }'
```

**Expected:**
- Status: 200
- Response: `{ commandId, status: "succeeded", actualValue: true }`
- Value flipped from false to true (ignores provided value)
- State updated to true

---

### Scenario 3: Blocked by Interlock (Range Check)

**Setup:**
- Endpoint 20 exists (AO, active, valueType=float)
- Interlock configured:
  - tileId: 5
  - mode: "permissive"
  - condition: `{ "type": "range", "min": 0, "max": 100 }`
  - onViolationAction: "block"
  - severity: "warning"

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 20,
    "value": 150,
    "tileId": 5,
    "commandType": "write"
  }'
```

**Expected:**
- Status: 403
- Response: `{ commandId, status: "blocked", message: "Interlock 'Temperature Safety': Value 150 outside allowed range [0, 100]", interlockId: 3 }`
- `command_log` entry: status=blocked, errorMessage populated
- `interlock_evaluations` entry: passed=false, failedCondition populated
- `alarm_events` entry: status=active, severity=warning, message="Command blocked: ..."
- NO state update (command never sent)

---

### Scenario 4: Invalid Endpoint (Not Found)

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 99999,
    "value": true
  }'
```

**Expected:**
- Status: 404
- Response: `{ error: "Endpoint not found", message: "No endpoint found with id 99999" }`
- NO database writes

---

### Scenario 5: Read-Only Endpoint

**Setup:**
- Endpoint 30 exists (DI, active) - Digital Input (read-only)

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 30,
    "value": true
  }'
```

**Expected:**
- Status: 400
- Response: `{ error: "Endpoint not writable", message: "Endpoint kind DI is read-only" }`
- NO database writes

---

### Scenario 6: Inactive Endpoint

**Setup:**
- Endpoint 40 exists (DO, status=offline)

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 40,
    "value": true
  }'
```

**Expected:**
- Status: 400
- Response: `{ error: "Endpoint not active", message: "Endpoint 40 is offline" }`
- NO database writes

---

### Scenario 7: Missing Required Fields

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 10
  }'
```

**Expected:**
- Status: 400
- Response: `{ error: "Invalid request", message: "endpointId and value are required" }`

---

### Scenario 8: Invalid Command Type

**Request:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 10,
    "value": true,
    "commandType": "invalid"
  }'
```

**Expected:**
- Status: 400
- Response: `{ error: "Invalid commandType", message: "commandType must be one of: write, toggle, pulse" }`

---

### Scenario 9: Correlation ID (Batch Commands)

**Request 1:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 10,
    "value": true,
    "correlationId": "batch-abc123"
  }'
```

**Request 2:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 11,
    "value": false,
    "correlationId": "batch-abc123"
  }'
```

**Expected:**
- Both commands succeed
- Both `command_log` entries have correlationId="batch-abc123"
- Can query all commands in batch: `SELECT * FROM command_log WHERE correlationId = 'batch-abc123'`

---

### Scenario 10: Query Command Status

**Setup:**
- Command executed with commandId="550e8400-e29b-41d4-a716-446655440000"

**Request:**
```bash
curl http://localhost:5007/api/os/command/550e8400-e29b-41d4-a716-446655440000
```

**Expected:**
- Status: 200
- Response includes:
  - Full lifecycle timestamps (requestedAt, sentAt, ackedAt, completedAt)
  - Status (succeeded/failed/blocked)
  - Requested vs actual values
  - Error message (if failed/blocked)

---

## 📊 Database Tables Touched

### Write Operations

| Table | Operation | When |
|-------|-----------|------|
| `command_log` | INSERT | Every command (queued) |
| `command_log` | UPDATE | Status transitions (sent, acked, succeeded, failed, blocked) |
| `interlock_evaluations` | INSERT | Every interlock check |
| `alarm_events` | INSERT | Interlock violation (blocked commands) |
| `endpoint_current` | UPSERT | Command success |
| `telemetry_readings` | INSERT | Command success |

### Read Operations

| Table | Operation | When |
|-------|-----------|------|
| `hardware_endpoints` | SELECT | Validate endpoint exists and is writable |
| `safety_interlocks` | SELECT | Evaluate interlocks |
| `endpoint_current` | SELECT | Toggle command (read current value) |

---

## 🎯 Implementation Rules Enforced

### ✅ Non-Negotiable Rules

1. **No direct hardware writes** - All writes go through `/command`
2. **No UI-driven state** - State comes from telemetry + command results
3. **No silent safety** - Every block/force-off/override leaves a trail
4. **No control logic in OS** - OS executes, enforces, records

### ✅ Command Lifecycle Tracking

- Every command gets a UUID (`commandId`)
- Full timing: `requestedAt`, `sentAt`, `ackedAt`, `completedAt`
- Status transitions: `queued` → `sent` → `acked` → `succeeded`/`failed`
- Correlation IDs for grouping related commands

### ✅ Interlock Evaluation

- Every command evaluated against active interlocks
- Evaluation logged to `interlock_evaluations` (explainability)
- Blocked commands create alarms
- Interlocks can block, force, or advise

### ✅ State Management

- `endpoint_current` updated on success (fast cache)
- `telemetry_readings` records historical values
- Source tracking: "command" vs "hardware" vs "derived"
- Quality flags: "good" vs "bad" vs "uncertain"

### ✅ Error Handling

- Validation errors: 400
- Not found: 404
- Interlock blocked: 403
- Node communication failure: 500
- All errors logged to `command_log.errorMessage`

---

## 🔧 Mock Node Communication

**Current Implementation (Phase 3.2):**
- Simulates 100ms total latency (50ms send + 50ms ack)
- Always succeeds (no random failures)
- Updates `command_log` status at each step
- Returns actual value (handles toggle/pulse logic)

**Production Implementation (Future):**
- WebSocket or MQTT to hardware nodes
- Async command queue (Redis/RabbitMQ)
- Timeout handling (configurable per node)
- Retry logic with exponential backoff
- Node health monitoring
- Command priority queues

---

## 🚀 Next Steps: Phase 4

**Goal:** Seed Data + UI Integration

**Tasks:**
1. Create seed data script with sample devices:
   - 2 controller nodes (Raspberry Pi, Arduino)
   - 10+ hardware endpoints (DI, DO, AI, AO, 1WIRE)
   - 5+ device tiles (vessel, temp_sensor, pump, valve)
   - Tile-endpoint bindings
   - Sample interlocks (temperature range, pressure limit)
   - Sample telemetry data

2. Build Control Panel UI:
   - Canvas renderer (tiles with x/y/w/h)
   - Live telemetry display (WebSocket or polling)
   - Alarm banner
   - Command buttons (with confirmation)
   - Interlock status indicators

3. WebSocket for real-time updates:
   - Broadcast telemetry updates
   - Broadcast alarm events
   - Broadcast command status changes

---

## 📝 Notes

- Command pipeline is production-ready for mock hardware
- All safety rules enforced (interlocks, logging, alarms)
- Full audit trail for every command
- Ready for UI integration
- Ready for real hardware integration (replace mock layer)

**Phase 3.2 is complete and ready for testing.**
