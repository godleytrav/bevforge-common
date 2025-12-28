# Phase 5: Command Pipeline Testing Guide

## 🎯 Overview

**Goal:** Test the command pipeline with seed data to verify:
- Command execution (happy path)
- Interlock evaluation and blocking
- Command lifecycle tracking
- State updates (endpoint_current + telemetry_readings)
- Device group mutual exclusion
- Alarm generation

**Prerequisites:**
- Phase 3.2 complete (command pipeline endpoints)
- Phase 4 complete (seed data loaded)
- Development server running (`npm run dev`)

---

## 📋 Test Scenarios

### Test 1: Basic Command Execution (Happy Path)

**Objective:** Verify command succeeds when all interlocks pass

**Setup:**
```bash
# Ensure seed data is loaded
npm run seed

# Start dev server
npm run dev
```

**Test Command:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 19,
    "value": true,
    "correlationId": "test-hlt-pump-on"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "commandId": "<uuid>",
  "status": "succeeded",
  "message": "Command succeeded",
  "interlocksPassed": true,
  "interlockResults": [
    {
      "interlockId": 4,
      "name": "Pump Dry Run Protection",
      "passed": true,
      "reason": "Interlock satisfied"
    }
  ]
}
```

**Verification Queries:**
```sql
-- Check command log
SELECT 
  command_id,
  endpoint_id,
  requested_value_bool,
  actual_value_bool,
  status,
  interlocks_passed,
  correlation_id,
  requested_at,
  sent_at,
  completed_at
FROM command_log
WHERE correlation_id = 'test-hlt-pump-on';

-- Check endpoint_current updated
SELECT 
  e.name,
  ec.value_bool,
  ec.source,
  ec.updated_at
FROM endpoint_current ec
JOIN hardware_endpoints e ON e.id = ec.endpoint_id
WHERE ec.endpoint_id = 19;

-- Check telemetry_readings logged
SELECT 
  endpoint_id,
  value_bool,
  quality,
  source,
  timestamp
FROM telemetry_readings
WHERE endpoint_id = 19
ORDER BY timestamp DESC
LIMIT 1;
```

**Expected Results:**
- ✅ Command status: `succeeded`
- ✅ `interlocks_passed`: true
- ✅ `endpoint_current.value_bool`: true
- ✅ `endpoint_current.source`: 'command'
- ✅ `telemetry_readings` has new entry with source='command'
- ✅ All timestamps populated (requested_at, sent_at, completed_at)

---

### Test 2: Command Status Query

**Objective:** Verify GET /api/os/command/:commandId returns full lifecycle data

**Test Command:**
```bash
# Use commandId from Test 1 response
curl http://localhost:5007/api/os/command/<commandId>
```

**Expected Response:**
```json
{
  "success": true,
  "command": {
    "commandId": "<uuid>",
    "endpointId": 19,
    "endpointName": "HLT Pump Relay",
    "requestedValue": true,
    "actualValue": true,
    "status": "succeeded",
    "interlocksPassed": true,
    "correlationId": "test-hlt-pump-on",
    "requestedAt": "2025-12-27T...",
    "sentAt": "2025-12-27T...",
    "completedAt": "2025-12-27T...",
    "errorMessage": null
  }
}
```

**Expected Results:**
- ✅ All lifecycle timestamps present
- ✅ Requested value matches actual value
- ✅ Status is 'succeeded'
- ✅ No error message

---

### Test 3: Interlock - Temperature High Limit

**Objective:** Verify command blocked when temperature exceeds limit

**Setup:**
```sql
-- Modify HLT temperature to exceed 212°F limit
UPDATE endpoint_current
SET value_num = 220.0
WHERE endpoint_id = 15; -- HLT Temperature Sensor
```

**Test Command:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 23,
    "value": 50,
    "correlationId": "test-heater-temp-high"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "commandId": "<uuid>",
  "status": "blocked",
  "message": "Command blocked by safety interlocks",
  "interlocksPassed": false,
  "interlockResults": [
    {
      "interlockId": 1,
      "name": "HLT Temperature High Limit",
      "passed": false,
      "reason": "Value 220 exceeds maximum 212"
    }
  ]
}
```

**Verification Queries:**
```sql
-- Check command log
SELECT 
  command_id,
  status,
  interlocks_passed,
  error_message
FROM command_log
WHERE correlation_id = 'test-heater-temp-high';

-- Check interlock_evaluations
SELECT 
  ie.interlock_id,
  si.name,
  ie.passed,
  ie.reason,
  ie.evaluated_at
FROM interlock_evaluations ie
JOIN safety_interlocks si ON si.id = ie.interlock_id
WHERE ie.command_id = (SELECT command_id FROM command_log WHERE correlation_id = 'test-heater-temp-high');

-- Check alarm_events
SELECT 
  ae.alarm_type,
  ae.severity,
  ae.message,
  ae.status,
  ae.triggered_at
FROM alarm_events ae
WHERE ae.source_id = 1 -- HLT Temperature High Limit interlock
ORDER BY ae.triggered_at DESC
LIMIT 1;
```

**Expected Results:**
- ✅ Command status: `blocked`
- ✅ `interlocks_passed`: false
- ✅ Interlock evaluation logged with `passed=false`
- ✅ Alarm event created with severity='critical'
- ✅ Alarm status: 'active'
- ✅ `endpoint_current` NOT updated (command blocked)

**Cleanup:**
```sql
-- Reset HLT temperature to normal
UPDATE endpoint_current
SET value_num = 180.0
WHERE endpoint_id = 15;
```

---

### Test 4: Interlock - Pump Dry Run Protection

**Objective:** Verify pump command blocked when level sensor is false

**Setup:**
```sql
-- Set HLT level sensor to false (empty)
UPDATE endpoint_current
SET value_bool = false
WHERE endpoint_id = 17; -- HLT Level Sensor
```

**Test Command:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 19,
    "value": true,
    "correlationId": "test-pump-dry-run"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "commandId": "<uuid>",
  "status": "blocked",
  "message": "Command blocked by safety interlocks",
  "interlocksPassed": false,
  "interlockResults": [
    {
      "interlockId": 4,
      "name": "Pump Dry Run Protection",
      "passed": false,
      "reason": "Required endpoint 17 (HLT Level Sensor) is false"
    }
  ]
}
```

**Verification Queries:**
```sql
-- Check command log
SELECT 
  command_id,
  status,
  interlocks_passed,
  error_message
FROM command_log
WHERE correlation_id = 'test-pump-dry-run';

-- Check interlock_evaluations
SELECT 
  ie.interlock_id,
  si.name,
  ie.passed,
  ie.reason
FROM interlock_evaluations ie
JOIN safety_interlocks si ON si.id = ie.interlock_id
WHERE ie.command_id = (SELECT command_id FROM command_log WHERE correlation_id = 'test-pump-dry-run');

-- Check alarm_events
SELECT 
  ae.alarm_type,
  ae.severity,
  ae.message,
  ae.status
FROM alarm_events ae
WHERE ae.source_id = 4 -- Pump Dry Run Protection interlock
ORDER BY ae.triggered_at DESC
LIMIT 1;
```

**Expected Results:**
- ✅ Command status: `blocked`
- ✅ `interlocks_passed`: false
- ✅ Interlock evaluation logged with specific reason
- ✅ Alarm event created with severity='warning'
- ✅ `endpoint_current` NOT updated

**Cleanup:**
```sql
-- Reset HLT level sensor to true
UPDATE endpoint_current
SET value_bool = true
WHERE endpoint_id = 17;
```

---

### Test 5: Interlock - Door Interlock

**Objective:** Verify commands blocked when door is open

**Setup:**
```sql
-- Set door switch to false (open)
UPDATE endpoint_current
SET value_bool = false
WHERE endpoint_id = 18; -- Door Interlock Switch
```

**Test Command:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 21,
    "value": true,
    "correlationId": "test-door-open"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "commandId": "<uuid>",
  "status": "blocked",
  "message": "Command blocked by safety interlocks",
  "interlocksPassed": false,
  "interlockResults": [
    {
      "interlockId": 5,
      "name": "Door Interlock",
      "passed": false,
      "reason": "Required endpoint 18 (Door Interlock Switch) is false"
    }
  ]
}
```

**Verification Queries:**
```sql
-- Check command log
SELECT 
  command_id,
  status,
  interlocks_passed
FROM command_log
WHERE correlation_id = 'test-door-open';

-- Check interlock_evaluations
SELECT 
  ie.interlock_id,
  si.name,
  ie.passed,
  ie.reason
FROM interlock_evaluations ie
JOIN safety_interlocks si ON si.id = ie.interlock_id
WHERE ie.command_id = (SELECT command_id FROM command_log WHERE correlation_id = 'test-door-open');
```

**Expected Results:**
- ✅ Command status: `blocked`
- ✅ `interlocks_passed`: false
- ✅ Alarm event created

**Cleanup:**
```sql
-- Reset door switch to true (closed)
UPDATE endpoint_current
SET value_bool = true
WHERE endpoint_id = 18;
```

---

### Test 6: Device Group - Pump Mutual Exclusion

**Objective:** Verify only one pump can run at a time

**Test Commands:**
```bash
# Step 1: Turn on HLT pump (should succeed)
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 19,
    "value": true,
    "correlationId": "test-pump-1-on"
  }'

# Step 2: Attempt to turn on Mash pump (should be blocked)
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 20,
    "value": true,
    "correlationId": "test-pump-2-blocked"
  }'
```

**Expected Response (Step 1):**
```json
{
  "success": true,
  "commandId": "<uuid>",
  "status": "succeeded",
  "message": "Command succeeded"
}
```

**Expected Response (Step 2):**
```json
{
  "success": false,
  "commandId": "<uuid>",
  "status": "blocked",
  "message": "Command blocked by device group mutual exclusion",
  "groupConflict": {
    "groupId": 1,
    "groupName": "Brewhouse Pumps",
    "policy": "block",
    "activeDevices": ["HLT Pump"]
  }
}
```

**Verification Queries:**
```sql
-- Check both commands
SELECT 
  cl.command_id,
  cl.correlation_id,
  cl.status,
  e.name AS endpoint_name
FROM command_log cl
JOIN hardware_endpoints e ON e.id = cl.endpoint_id
WHERE cl.correlation_id IN ('test-pump-1-on', 'test-pump-2-blocked')
ORDER BY cl.requested_at;

-- Check endpoint_current states
SELECT 
  e.name,
  ec.value_bool
FROM endpoint_current ec
JOIN hardware_endpoints e ON e.id = ec.endpoint_id
WHERE ec.endpoint_id IN (19, 20);
```

**Expected Results:**
- ✅ First command (HLT pump): `succeeded`
- ✅ Second command (Mash pump): `blocked`
- ✅ HLT pump `endpoint_current.value_bool`: true
- ✅ Mash pump `endpoint_current.value_bool`: false (unchanged)
- ✅ Error message mentions device group mutual exclusion

**Cleanup:**
```bash
# Turn off HLT pump
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 19,
    "value": false,
    "correlationId": "test-pump-1-off"
  }'
```

---

### Test 7: Device Group - Valve Simultaneous Operation

**Objective:** Verify valves can operate simultaneously (no mutual exclusion)

**Test Commands:**
```bash
# Step 1: Open HLT inlet valve
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 21,
    "value": true,
    "correlationId": "test-valve-1-open"
  }'

# Step 2: Open Mash inlet valve (should also succeed)
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 22,
    "value": true,
    "correlationId": "test-valve-2-open"
  }'
```

**Expected Response (Both):**
```json
{
  "success": true,
  "commandId": "<uuid>",
  "status": "succeeded",
  "message": "Command succeeded"
}
```

**Verification Queries:**
```sql
-- Check both commands
SELECT 
  cl.command_id,
  cl.correlation_id,
  cl.status,
  e.name AS endpoint_name
FROM command_log cl
JOIN hardware_endpoints e ON e.id = cl.endpoint_id
WHERE cl.correlation_id IN ('test-valve-1-open', 'test-valve-2-open')
ORDER BY cl.requested_at;

-- Check endpoint_current states
SELECT 
  e.name,
  ec.value_bool
FROM endpoint_current ec
JOIN hardware_endpoints e ON e.id = ec.endpoint_id
WHERE ec.endpoint_id IN (21, 22);
```

**Expected Results:**
- ✅ Both commands: `succeeded`
- ✅ Both valves `endpoint_current.value_bool`: true
- ✅ No group conflict errors

**Cleanup:**
```bash
# Close both valves
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{"endpointId": 21, "value": false, "correlationId": "test-valve-1-close"}'

curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{"endpointId": 22, "value": false, "correlationId": "test-valve-2-close"}'
```

---

### Test 8: PWM Command (Heater Control)

**Objective:** Verify PWM value (0-100%) stored correctly

**Test Command:**
```bash
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": 23,
    "value": 75,
    "correlationId": "test-heater-pwm"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "commandId": "<uuid>",
  "status": "succeeded",
  "message": "Command succeeded",
  "interlocksPassed": true
}
```

**Verification Queries:**
```sql
-- Check command log
SELECT 
  command_id,
  requested_value_num,
  actual_value_num,
  status
FROM command_log
WHERE correlation_id = 'test-heater-pwm';

-- Check endpoint_current
SELECT 
  e.name,
  ec.value_num,
  ec.source,
  ec.updated_at
FROM endpoint_current ec
JOIN hardware_endpoints e ON e.id = ec.endpoint_id
WHERE ec.endpoint_id = 23;

-- Check telemetry_readings
SELECT 
  endpoint_id,
  value_num,
  quality,
  source,
  timestamp
FROM telemetry_readings
WHERE endpoint_id = 23
ORDER BY timestamp DESC
LIMIT 1;
```

**Expected Results:**
- ✅ Command status: `succeeded`
- ✅ `requested_value_num`: 75
- ✅ `actual_value_num`: 75
- ✅ `endpoint_current.value_num`: 75
- ✅ `endpoint_current.source`: 'command'
- ✅ `telemetry_readings` has new entry with value_num=75

**Cleanup:**
```bash
# Turn off heater
curl -X POST http://localhost:5007/api/os/command \
  -H "Content-Type: application/json" \
  -d '{"endpointId": 23, "value": 0, "correlationId": "test-heater-off"}'
```

---

## 📊 Test Results Summary

### Test Execution Checklist

- [ ] Test 1: Basic Command Execution (Happy Path)
- [ ] Test 2: Command Status Query
- [ ] Test 3: Interlock - Temperature High Limit
- [ ] Test 4: Interlock - Pump Dry Run Protection
- [ ] Test 5: Interlock - Door Interlock
- [ ] Test 6: Device Group - Pump Mutual Exclusion
- [ ] Test 7: Device Group - Valve Simultaneous Operation
- [ ] Test 8: PWM Command (Heater Control)

### Results Table

| Test | Status | Notes |
|------|--------|-------|
| 1. Basic Command Execution | ⬜ Not Run | |
| 2. Command Status Query | ⬜ Not Run | |
| 3. Temperature High Limit | ⬜ Not Run | |
| 4. Pump Dry Run Protection | ⬜ Not Run | |
| 5. Door Interlock | ⬜ Not Run | |
| 6. Pump Mutual Exclusion | ⬜ Not Run | |
| 7. Valve Simultaneous Operation | ⬜ Not Run | |
| 8. PWM Command | ⬜ Not Run | |

---

## 🔍 General Verification Queries

### Command Log Overview
```sql
SELECT 
  cl.command_id,
  cl.correlation_id,
  e.name AS endpoint_name,
  cl.status,
  cl.interlocks_passed,
  cl.requested_at,
  cl.completed_at,
  TIMESTAMPDIFF(MILLISECOND, cl.requested_at, cl.completed_at) AS duration_ms
FROM command_log cl
JOIN hardware_endpoints e ON e.id = cl.endpoint_id
ORDER BY cl.requested_at DESC
LIMIT 20;
```

### Interlock Evaluation History
```sql
SELECT 
  ie.id,
  cl.correlation_id,
  si.name AS interlock_name,
  ie.passed,
  ie.reason,
  ie.evaluated_at
FROM interlock_evaluations ie
JOIN command_log cl ON cl.command_id = ie.command_id
JOIN safety_interlocks si ON si.id = ie.interlock_id
ORDER BY ie.evaluated_at DESC
LIMIT 20;
```

### Active Alarms
```sql
SELECT 
  ae.id,
  ae.alarm_type,
  ae.severity,
  ae.message,
  ae.status,
  ae.triggered_at,
  ae.acknowledged_at,
  ae.cleared_at
FROM alarm_events ae
WHERE ae.status IN ('active', 'cleared_unacked')
ORDER BY ae.triggered_at DESC;
```

### Endpoint Current States
```sql
SELECT 
  e.id,
  e.name,
  e.endpoint_kind,
  ec.value_bool,
  ec.value_num,
  ec.quality,
  ec.source,
  ec.updated_at
FROM endpoint_current ec
JOIN hardware_endpoints e ON e.id = ec.endpoint_id
ORDER BY e.id;
```

---

## 🚀 Next Steps

After completing Phase 5 testing:

1. **Document any issues found** - Create GitHub issues or notes
2. **Fix any bugs** - Update command pipeline code as needed
3. **Phase 6: Control Panel UI** - Build React components for:
   - Device canvas (drag-and-drop tiles)
   - Tile components (vessels, sensors, actuators)
   - Control panel (command buttons, status displays)
   - Alarm panel (active alarms, acknowledgment)
   - Interlock status display
   - Node management UI

---

## 📝 Notes

- All tests use correlation IDs for easy tracking
- Cleanup commands provided after each test
- SQL verification queries included for each scenario
- Expected responses documented for comparison
- Test results table for tracking progress

**Phase 5 testing validates the entire command pipeline is working correctly!**
