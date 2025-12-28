# Phase 4: Seed Data & Testing - COMPLETE

## ✅ Status: COMPLETE

**Date:** December 27, 2025  
**Phase:** 4 - Seed Data & Testing  
**Goal:** Create comprehensive test data for the control panel system

---

## 📊 Summary

**All 10 tasks completed (100%)**

### Files Created

1. **`src/server/db/seed.ts`** (961 lines)
   - Complete seed data generation script
   - Helper functions for timestamps and random values
   - Comprehensive data across all OS Control Panel tables

2. **`package.json`** (updated)
   - Added `npm run seed` script

**Total:** 1 new file, 1 updated file, 961 lines of code

---

## 🗄️ Seed Data Created

### 1. Controller Nodes (2)

- **Brewhouse Controller** (Raspberry Pi 4B)
  - Node ID: `brewhouse-rpi-001`
  - IP: 192.168.1.100
  - Capabilities: GPIO (40 pins), I2C, SPI, 1-Wire
  - Status: Active

- **Fermentation Controller** (Arduino Mega 2560)
  - Node ID: `fermentation-arduino-001`
  - IP: 192.168.1.101
  - Capabilities: 54 digital pins, 16 analog pins, 15 PWM pins
  - Status: Active

---

### 2. Hardware Endpoints (16)

#### Digital Inputs (DI) - 3 endpoints
- HLT Level Sensor (GPIO17)
- Mash Tun Level Sensor (GPIO27)
- Door Interlock Switch (GPIO22)

#### Digital Outputs (DO) - 6 endpoints
- HLT Pump Relay (GPIO23)
- Mash Pump Relay (GPIO24)
- HLT Inlet Valve (GPIO25)
- Mash Inlet Valve (GPIO26)
- Fermenter 1 Cooling (D2)
- Fermenter 2 Cooling (D3)

#### Analog Inputs (AI) - 4 endpoints
- HLT Pressure Sensor (ADS1115_0, 0-30 psi)
- Mash Tun Pressure Sensor (ADS1115_1, 0-30 psi)
- Fermenter 1 Temperature (A0, TMP36, 32-212°F)
- Fermenter 2 Temperature (A1, TMP36, 32-212°F)

#### PWM Outputs - 1 endpoint
- HLT Heater Control (GPIO18, 0-100%)

#### 1-Wire Sensors - 2 endpoints
- HLT Temperature Sensor (DS18B20, 32-212°F)
- Mash Tun Temperature Sensor (DS18B20, 32-212°F)

---

### 3. Device Tiles (9)

#### Vessels (2)
- **Hot Liquor Tank (HLT)**
  - Tile ID: `tile-hlt-001`
  - Position: (50, 100), Size: 200x300
  - Capacity: 20 gal, Stainless steel
  - Status: Operational

- **Mash Tun**
  - Tile ID: `tile-mash-001`
  - Position: (300, 100), Size: 200x300
  - Capacity: 15 gal, Stainless steel, with agitator
  - Status: Operational

#### Temperature Sensors (2)
- **HLT Temperature** (child of HLT vessel)
  - Tile ID: `tile-hlt-temp-001`
  - Position: (100, 150), Size: 100x80
  - Range: 32-212°F, DS18B20

- **Mash Tun Temperature** (child of Mash Tun vessel)
  - Tile ID: `tile-mash-temp-001`
  - Position: (350, 150), Size: 100x80
  - Range: 32-212°F, DS18B20

#### Pumps (2)
- **HLT Pump**
  - Tile ID: `tile-hlt-pump-001`
  - Position: (150, 450), Size: 100x80
  - Type: Centrifugal, 10 gpm max

- **Mash Pump**
  - Tile ID: `tile-mash-pump-001`
  - Position: (400, 450), Size: 100x80
  - Type: Centrifugal, 8 gpm max

#### Valves (2)
- **HLT Inlet Valve**
  - Tile ID: `tile-hlt-valve-001`
  - Position: (50, 50), Size: 80x60
  - Type: Solenoid, normally closed

- **Mash Inlet Valve**
  - Tile ID: `tile-mash-valve-001`
  - Position: (300, 50), Size: 80x60
  - Type: Solenoid, normally closed

#### Relay/SSR (1)
- **HLT Heater**
  - Tile ID: `tile-hlt-heater-001`
  - Position: (100, 250), Size: 100x60
  - Type: SSR, 40A max, PWM capable

---

### 4. Tile-Endpoint Bindings (9)

| Tile | Endpoint | Role | Direction |
|------|----------|------|----------|
| HLT Temperature | HLT Temp Sensor | pv | input |
| Mash Temperature | Mash Temp Sensor | pv | input |
| HLT Pump | HLT Pump Relay | output | output |
| Mash Pump | Mash Pump Relay | output | output |
| HLT Inlet Valve | HLT Inlet Valve | output | output |
| Mash Inlet Valve | Mash Inlet Valve | output | output |
| HLT Heater | HLT Heater Control | output | output |
| HLT Vessel | HLT Level Sensor | state | input |
| Mash Tun Vessel | Mash Level Sensor | state | input |

---

### 5. Safety Interlocks (5)

1. **HLT Temperature High Limit**
   - Mode: Trip
   - Condition: Range 32-212°F
   - Action: Block
   - Severity: Critical

2. **Mash Temperature Range**
   - Mode: Permissive
   - Condition: Range 32-180°F
   - Action: Block
   - Severity: Warning

3. **HLT Pressure High Limit**
   - Mode: Trip
   - Condition: Range 0-25 psi
   - Action: Force Off
   - Severity: Critical

4. **Pump Dry Run Protection**
   - Mode: Permissive
   - Condition: Requires HLT level sensor = true
   - Action: Block
   - Severity: Warning

5. **Door Interlock**
   - Mode: Permissive
   - Condition: Requires door closed (sensor = true)
   - Action: Block
   - Severity: Warning

---

### 6. Device Groups (2)

1. **Brewhouse Pumps**
   - Members: HLT Pump, Mash Pump
   - Mutual Exclusion: Yes
   - Policy: Block (only one pump can run at a time)

2. **Inlet Valves**
   - Members: HLT Inlet Valve, Mash Inlet Valve
   - Mutual Exclusion: No
   - Policy: None (both can be open simultaneously)

---

### 7. Historical Telemetry Data (7,000 readings)

**Time Range:** Last 24 hours  
**Sampling:** 1000 timestamps evenly distributed

**Data Generated:**

- **HLT Temperature:** 1000 readings
  - Start: 68°F (room temp)
  - Trend: Slowly heating to ~180°F
  - Variation: ±0.5-1.5°F per reading
  - Quality: Good
  - Source: Hardware

- **Mash Tun Temperature:** 1000 readings
  - Start: 68°F
  - Trend: Following HLT with lag, up to ~170°F
  - Variation: ±0.3-0.8°F per reading
  - Quality: Good
  - Source: Hardware

- **HLT Pressure:** 1000 readings
  - Range: 4.5-5.5 psi (stable)
  - Quality: Good
  - Source: Hardware

- **Mash Pressure:** 1000 readings
  - Range: 2.8-3.2 psi (stable)
  - Quality: Good
  - Source: Hardware

- **HLT Level Sensor:** 1000 readings
  - Value: Mostly true (90% probability)
  - Quality: Good
  - Source: Hardware

- **Mash Level Sensor:** 1000 readings
  - Value: Mostly true (85% probability)
  - Quality: Good
  - Source: Hardware

- **Door Interlock:** 1000 readings
  - Value: Mostly true/closed (95% probability)
  - Quality: Good
  - Source: Hardware

**Total:** 7,000 telemetry readings inserted in batches of 100

---

### 8. Endpoint Current Cache (13 entries)

**Sensors (current values):**
- HLT Temperature: ~180°F (latest from telemetry)
- Mash Temperature: ~170°F (latest from telemetry)
- HLT Pressure: 5.0 psi
- Mash Pressure: 3.0 psi
- HLT Level: true
- Mash Level: true
- Door Interlock: true (closed)

**Actuators (initial states):**
- HLT Pump: false (off)
- Mash Pump: false (off)
- HLT Inlet Valve: false (closed)
- Mash Inlet Valve: false (closed)
- HLT Heater: 0% (off)
- Fermenter 1 Cooling: false (off)
- Fermenter 2 Cooling: false (off)

---

## 🧪 Testing the Seed Data

### Run the Seed Script

```bash
npm run seed
```

**Expected Output:**
```
[SEED] Starting seed data creation...
[SEED] Clearing existing data...
[SEED] Existing data cleared
[SEED] Creating controller nodes...
[SEED] Created nodes: Brewhouse (5), Fermentation (6)
[SEED] Creating hardware endpoints...
[SEED] Created 16 hardware endpoints starting at ID 17
[SEED] Endpoint mapping created
[SEED] Seed data structure initialized
[SEED] Creating device tiles...
[SEED] Created 9 device tiles starting at ID 10
[SEED] Updated parent tile relationships
[SEED] Creating tile-endpoint bindings...
[SEED] Created tile-endpoint bindings
[SEED] Creating safety interlocks...
[SEED] Created safety interlocks
[SEED] Creating device groups...
[SEED] Created device groups
[SEED] Generating historical telemetry data...
[SEED] Generated 7000 telemetry readings
[SEED] Populating endpoint_current cache...
[SEED] Populated endpoint_current cache
[SEED] Seed data structure initialized
[SEED] Seed data creation completed successfully
```

### Verify Data in Database

```sql
-- Check controller nodes
SELECT * FROM controller_nodes;

-- Check hardware endpoints
SELECT id, name, endpoint_kind, address, status FROM hardware_endpoints;

-- Check device tiles
SELECT id, tile_id, name, tile_type, status FROM device_tiles;

-- Check tile-endpoint bindings
SELECT * FROM tile_endpoint_bindings;

-- Check safety interlocks
SELECT id, name, mode, severity, enabled FROM safety_interlocks;

-- Check device groups
SELECT * FROM device_groups;

-- Check telemetry count
SELECT COUNT(*) FROM telemetry_readings;

-- Check endpoint current values
SELECT e.name, ec.value_num, ec.value_bool, ec.quality, ec.source
FROM endpoint_current ec
JOIN hardware_endpoints e ON e.id = ec.endpoint_id;
```

---

## 🎯 Key Features

### Realistic Data

✅ **Temperature Trends**
- Gradual heating curves
- Realistic variation (±0.5-1.5°F)
- Mash follows HLT with lag

✅ **Pressure Stability**
- Stable readings around setpoints
- Small random variation

✅ **Level Sensors**
- Mostly true (vessels filled)
- Occasional false readings (realistic)

✅ **Safety Interlocks**
- Temperature limits
- Pressure limits
- Dry-run protection
- Door safety

✅ **Device Groups**
- Mutual exclusion for pumps
- Flexible valve control

### Data Relationships

✅ **Parent-Child Tiles**
- Temperature sensors belong to vessels
- Proper `parentTileId` relationships

✅ **Tile-Endpoint Bindings**
- Sensors bound to input endpoints (pv role)
- Actuators bound to output endpoints (output role)
- Vessels bound to level sensors (state role)

✅ **Telemetry History**
- 24 hours of data
- 1000 timestamps per sensor
- Realistic trends and variation

✅ **Current State Cache**
- Latest values for all endpoints
- Proper source tracking (hardware vs command)
- Quality flags

---

## 🚀 Next Steps: Phase 5

**Goal:** Test Command Pipeline with Seed Data

**Tasks:**
1. Test POST /api/os/command with seed data
   - Write commands to pumps, valves, heater
   - Verify interlock evaluation
   - Check command logging
   - Verify state updates

2. Test GET /api/os/command/:commandId
   - Query command status
   - Verify lifecycle timestamps
   - Check error messages

3. Test interlock scenarios
   - Temperature out of range
   - Pressure high limit
   - Pump dry-run protection
   - Door interlock

4. Test device groups
   - Mutual exclusion (pumps)
   - Simultaneous operation (valves)

5. Create test scenarios document
   - curl commands for each test
   - Expected results
   - Verification queries

---

## 📝 Notes

- Seed script is idempotent (clears data before inserting)
- All IDs are auto-generated (insertId pattern)
- JSON fields properly stringified
- Timestamps use `new Date()` for current time
- Helper functions for realistic data generation
- Batch inserts for telemetry (100 per batch)

**Phase 4 is complete and ready for command pipeline testing!**
