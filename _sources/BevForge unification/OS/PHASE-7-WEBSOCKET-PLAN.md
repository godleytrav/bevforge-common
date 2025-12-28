# Phase 7: WebSocket Real-Time Updates - Implementation Plan

**Status:** PLANNED (Not Yet Implemented)  
**Priority:** Medium (Core functionality works without it)  
**Estimated Effort:** 8-12 hours

---

## Overview

Phase 7 adds real-time bidirectional communication between the Control Panel UI and the backend using WebSockets. This enables live telemetry updates, command status notifications, and alarm alerts without polling.

## Current State (Phase 6 Complete)

**What Works:**
- ✅ REST API for tiles, commands, telemetry, alarms
- ✅ Control Panel fetches tiles on load
- ✅ Commands sent via POST /api/os/command
- ✅ Interlock evaluation with endpoint state lookup
- ✅ Command lifecycle tracking (queued → sent → acked → succeeded/failed)

**What's Missing:**
- ❌ Real-time telemetry updates (currently requires page refresh)
- ❌ Live command status feedback (user doesn't see command completion)
- ❌ Alarm notifications (no push alerts)
- ❌ Device state synchronization across multiple clients

---

## Architecture

### Server-Side (Node.js + Express + ws)

```
src/server/
├── websocket/
│   ├── server.ts          # WebSocket server setup
│   ├── handlers.ts        # Message handlers (subscribe, unsubscribe, ping)
│   ├── broadcaster.ts     # Broadcast telemetry/alarms to clients
│   └── types.ts           # WebSocket message types
└── configure.js           # Update to initialize WebSocket server
```

### Client-Side (React)

```
src/
├── hooks/
│   └── useWebSocket.ts    # React hook for WebSocket connection
├── contexts/
│   └── WebSocketContext.tsx  # Global WebSocket provider
└── pages/os/
    └── ControlPanelPage.tsx  # Subscribe to telemetry updates
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install ws @types/ws
```

### Step 2: Create WebSocket Server

**File:** `src/server/websocket/server.ts`

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface Client {
  ws: WebSocket;
  subscriptions: Set<string>; // e.g., ['telemetry:59', 'alarms', 'commands']
}

const clients = new Map<string, Client>();

export function initializeWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = generateClientId();
    clients.set(clientId, { ws, subscriptions: new Set() });

    ws.on('message', (data: string) => {
      handleMessage(clientId, data);
    });

    ws.on('close', () => {
      clients.delete(clientId);
    });

    ws.send(JSON.stringify({ type: 'connected', clientId }));
  });

  return wss;
}

function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### Step 3: Message Protocol

**Client → Server Messages:**

```typescript
// Subscribe to telemetry updates for specific endpoints
{
  type: 'subscribe',
  channel: 'telemetry',
  endpointIds: [59, 60, 61]
}

// Subscribe to all alarms
{
  type: 'subscribe',
  channel: 'alarms'
}

// Subscribe to command status updates
{
  type: 'subscribe',
  channel: 'commands',
  commandIds: ['uuid-1', 'uuid-2']
}

// Unsubscribe
{
  type: 'unsubscribe',
  channel: 'telemetry',
  endpointIds: [59]
}

// Ping (keepalive)
{
  type: 'ping'
}
```

**Server → Client Messages:**

```typescript
// Telemetry update
{
  type: 'telemetry',
  endpointId: 59,
  value: 180.5,
  timestamp: '2025-12-27T06:00:00Z'
}

// Command status update
{
  type: 'command_status',
  commandId: 'uuid-123',
  status: 'succeeded',
  actualValue: true,
  completedAt: '2025-12-27T06:00:01Z'
}

// Alarm notification
{
  type: 'alarm',
  alarmId: 42,
  severity: 'critical',
  message: 'HLT temperature exceeded 212°F',
  timestamp: '2025-12-27T06:00:02Z'
}

// Pong (keepalive response)
{
  type: 'pong'
}
```

### Step 4: Broadcaster Module

**File:** `src/server/websocket/broadcaster.ts`

```typescript
import { clients } from './server.js';

export function broadcastTelemetry(endpointId: number, value: any, timestamp: Date) {
  const message = JSON.stringify({
    type: 'telemetry',
    endpointId,
    value,
    timestamp: timestamp.toISOString(),
  });

  clients.forEach((client) => {
    if (client.subscriptions.has(`telemetry:${endpointId}`)) {
      client.ws.send(message);
    }
  });
}

export function broadcastCommandStatus(commandId: string, status: string, actualValue: any) {
  const message = JSON.stringify({
    type: 'command_status',
    commandId,
    status,
    actualValue,
    completedAt: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.subscriptions.has(`commands:${commandId}`)) {
      client.ws.send(message);
    }
  });
}

export function broadcastAlarm(alarm: any) {
  const message = JSON.stringify({
    type: 'alarm',
    alarmId: alarm.id,
    severity: alarm.severity,
    message: alarm.message,
    timestamp: alarm.timestamp.toISOString(),
  });

  clients.forEach((client) => {
    if (client.subscriptions.has('alarms')) {
      client.ws.send(message);
    }
  });
}
```

### Step 5: Integrate with Command Pipeline

**File:** `src/server/api/os/command/POST.ts`

```typescript
import { broadcastCommandStatus } from '../../websocket/broadcaster.js';

// After command succeeds
broadcastCommandStatus(commandId, 'succeeded', actualValue);

// After command fails
broadcastCommandStatus(commandId, 'failed', null);
```

### Step 6: Integrate with Telemetry Ingest

**File:** `src/server/api/os/telemetry/ingest/POST.ts` (create if doesn't exist)

```typescript
import { broadcastTelemetry } from '../../../websocket/broadcaster.js';

// After writing to telemetry_readings and endpoint_current
broadcastTelemetry(endpointId, value, timestamp);
```

### Step 7: React Hook for WebSocket

**File:** `src/hooks/useWebSocket.ts`

```typescript
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => {
        // Trigger re-render to reconnect
      }, 3000);
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  const send = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, lastMessage, send };
}
```

### Step 8: Update Control Panel

**File:** `src/pages/os/ControlPanelPage.tsx`

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

export default function ControlPanelPage() {
  const { isConnected, lastMessage, send } = useWebSocket('ws://localhost:5007/ws');

  useEffect(() => {
    if (isConnected && devices.length > 0) {
      // Subscribe to telemetry for all device endpoints
      const endpointIds = devices
        .map((d) => d.endpointId)
        .filter((id): id is number => id !== undefined);

      send({
        type: 'subscribe',
        channel: 'telemetry',
        endpointIds,
      });

      // Subscribe to alarms
      send({
        type: 'subscribe',
        channel: 'alarms',
      });
    }
  }, [isConnected, devices]);

  useEffect(() => {
    if (lastMessage?.type === 'telemetry') {
      // Update device state with new telemetry
      setDevices((prev) =>
        prev.map((d) =>
          d.endpointId === lastMessage.endpointId
            ? { ...d, temperature: lastMessage.value }
            : d
        )
      );
    }

    if (lastMessage?.type === 'command_status') {
      // Show toast notification
      console.log('Command completed:', lastMessage);
    }

    if (lastMessage?.type === 'alarm') {
      // Show alarm notification
      alert(`ALARM: ${lastMessage.message}`);
    }
  }, [lastMessage]);

  // Rest of component...
}
```

---

## Testing Plan

### Test 1: WebSocket Connection
1. Start server with WebSocket enabled
2. Open Control Panel in browser
3. Verify WebSocket connection in DevTools Network tab
4. Check for `connected` message with clientId

### Test 2: Telemetry Subscription
1. Control Panel subscribes to endpoint IDs
2. Simulate telemetry update via POST /api/os/telemetry/ingest
3. Verify WebSocket message received in browser
4. Verify device state updates in UI

### Test 3: Command Status Updates
1. Toggle a pump via Control Panel
2. Verify command sent via POST /api/os/command
3. Verify WebSocket message received with command status
4. Verify UI shows command completion

### Test 4: Alarm Notifications
1. Trigger an interlock violation
2. Verify alarm created in database
3. Verify WebSocket message broadcast to clients
4. Verify UI shows alarm notification

### Test 5: Reconnection
1. Disconnect WebSocket (simulate network failure)
2. Verify UI shows disconnected state
3. Wait 3 seconds
4. Verify automatic reconnection
5. Verify subscriptions re-established

---

## Performance Considerations

### Server-Side
- **Connection Limit:** Limit to 100 concurrent WebSocket connections
- **Message Rate Limiting:** Max 10 messages/second per client
- **Subscription Limits:** Max 50 subscriptions per client
- **Heartbeat:** Ping every 30 seconds, disconnect if no pong after 60 seconds

### Client-Side
- **Reconnection Backoff:** Exponential backoff (3s, 6s, 12s, 30s max)
- **Message Buffering:** Queue messages during disconnection
- **Subscription Management:** Unsubscribe from endpoints when devices removed

---

## Security Considerations

### Authentication
- **Option 1:** JWT token in WebSocket URL query string
- **Option 2:** Send auth token in first message after connection
- **Option 3:** Use HTTP session cookies (if same-origin)

### Authorization
- Validate subscriptions against user permissions
- Only broadcast telemetry for endpoints user has access to
- Filter alarms by user's assigned nodes/tiles

---

## Alternative: Server-Sent Events (SSE)

If WebSocket complexity is too high, consider Server-Sent Events (SSE) as a simpler alternative:

**Pros:**
- Simpler protocol (HTTP-based)
- Automatic reconnection built-in
- Works through most proxies/firewalls

**Cons:**
- One-way only (server → client)
- Less efficient than WebSocket
- Limited browser support for older browsers

**Implementation:**
```typescript
// Server
app.get('/api/os/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Add client to broadcaster
  // ...
});

// Client
const eventSource = new EventSource('/api/os/events');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle telemetry/alarm updates
};
```

---

## Deployment Considerations

### Development
- WebSocket URL: `ws://localhost:5007/ws`
- No authentication required

### Production
- WebSocket URL: `wss://bevforge.example.com/ws` (secure WebSocket)
- Nginx reverse proxy configuration:
  ```nginx
  location /ws {
    proxy_pass http://localhost:5007;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
  ```

---

## Next Steps

1. **Implement WebSocket server** (Step 2)
2. **Create message protocol** (Step 3)
3. **Integrate with command pipeline** (Step 5)
4. **Create React hook** (Step 7)
5. **Update Control Panel** (Step 8)
6. **Test end-to-end** (Testing Plan)
7. **Document for production deployment**

---

## Conclusion

Phase 7 is **optional for MVP** but **highly recommended for production**. The current REST API implementation is fully functional, but WebSocket adds significant UX improvements:

- **Real-time feedback** - Users see command results immediately
- **Live telemetry** - No need to refresh page for sensor updates
- **Instant alarms** - Critical safety notifications pushed to UI
- **Multi-user sync** - Multiple operators see same state

**Recommendation:** Implement Phase 7 after user testing Phase 6 to validate the REST API approach first.
