# System Architecture: Solving "Server Ping Client"

## The Problem

In traditional HTTP, servers **cannot** initiate connections to clients:

```
❌ DOESN'T WORK:

Training Backend                   Dashboard (Browser)
                                   (behind firewall/NAT)
      │                                   │
      │──── HTTP Request ────────────────►│
      │                                   │
      │  ✗ Can't initiate!                │
      │  ✗ Firewall blocks incoming       │
      │  ✗ No route to client             │
```

## The Solution: Persistent Client-Initiated Connection

```
✅ WORKS:

Dashboard                          Monitoring Backend
   │                                      │
   │──── 1. Open Connection ────────────►│
   │     (WebSocket/gRPC)                │
   │                                      │
   │     ╔════════════════════╗           │
   │═════║ Connection Active  ║═══════════│
   │     ╚════════════════════╝           │
   │                                      │
   │◄──── 2. Push Updates ───────────────│
   │                                      │
   │◄──── 3. Push Updates ───────────────│
   │                                      │
   │──── 4. Heartbeat ───────────────────►│
   │                                      │
   │◄──── 5. Push Updates ───────────────│
```

**Key Insight:** Client initiates, server pushes through the open connection!

## High-Level Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Training App   │────────►│ Monitoring       │────────►│  Dashboard  │
│  (PyTorch/TF)   │  gRPC   │ Backend (Python) │ WS/gRPC │  (Next.js)  │
└─────────────────┘         └──────────────────┘         └─────────────┘
    CLIENT 1                     SERVER                    CLIENT 2
```

**Flow:**
1. **Training App → Monitoring Backend**: Pushes telemetry via bidirectional gRPC
2. **Monitoring Backend → Dashboard**: Streams updates via WebSocket/gRPC-Web
3. **Key Design**: Dashboard initiates connection, backend pushes updates through it

## Complete Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Training App                            │
│                      (PyTorch/TensorFlow)                       │
│                                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Model   │→│  Batch     │→│ Telemetry │→│  gRPC     │     │
│  │ Training │  │ Processing │  │ Collector │  │  Client  │     │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘     │
│                                                    │            │
└────────────────────────────────────────────────────│────────────┘
                                                     │
                                         gRPC Stream │
                                         (Bidir)     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Monitoring Backend                         │
│                         (Python/FastAPI)                        │
│                                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐     │
│  │  gRPC    │→│ Telemetry  │→│ WebSocket │→│  State   │     │
│  │  Server  │  │  Processor │  │  Server  │  │  Manager │     │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘     │
│                                      │                          │
└──────────────────────────────────────│──────────────────────────┘
                                       │
                           WebSocket / │
                           gRPC-Web    │
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard                                │
│                       (Next.js/React)                           │
│                                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐     │
│  │WebSocket │→│   State    │→│  Image    │→│  Chart   │     │
│  │  Client  │  │  Manager   │  │  Grid    │  │ Renderer │     │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘     │
│                                                                  │
│  Displays: 16 image tiles, predictions, loss plot, FPS         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

### 1. System Startup

```
Dashboard              Monitoring Backend         Training App
   │                          │                         │
   │── WebSocket Connect ────►│                         │
   │                          │                         │
   │◄── Connection OK ────────│                         │
   │                          │                         │
   │   (waiting for data)     │                         │
   │                          │                         │
   │                          │◄── RegisterSession ─────│
   │                          │                         │
   │                          │─── SessionResponse ────►│
   │                          │                         │
   │◄── Training Started ─────│◄── StatusUpdate ────────│
   │   (notify user)          │                         │
```

### 2. Training Loop (Real-time Updates)

```
Dashboard              Monitoring Backend         Training App
   │                          │                         │
   │                          │◄── BatchData ───────────│
   │                          │    (16 images)          │
   │◄── Push BatchData ───────│                         │
   │   (display images)       │                         │
   │                          │                         │
   │                          │◄── PerformanceData ─────│
   │                          │    (FPS: 58.3)          │
   │◄── Push FPS Update ──────│                         │
   │   (update FPS display)   │                         │
   │                          │                         │
   │── Heartbeat ────────────►│                         │
   │   (I'm alive!)           │                         │
   │                          │                         │
   │                          │◄── BatchData ───────────│
   │◄── Push BatchData ───────│                         │
   │                          │                         │
```

### 3. Fault Recovery

```
Dashboard              Monitoring Backend         Training App
   │                          │                         │
   │◄── Push Data ────────────│◄── BatchData ───────────│
   │                          │                         │
   │  ✗✗✗ Connection Lost ✗✗✗│                         │
   │                          │                         │
   │   (detect via missing    │◄── BatchData ───────────│
   │    data/heartbeat)       │    (buffered)           │
   │                          │                         │
   │── Reconnect ────────────►│                         │
   │                          │                         │
   │◄── Buffered Data ────────│ (send buffered data)    │
   │   (catch up!)            │                         │
   │                          │                         │
   │◄── Live Data ────────────│◄── BatchData ───────────│
   │   (resumed)              │                         │
```

## Why This Architecture Works

### ✅ Solves "Server Ping Client" Problem
- Client (dashboard) initiates connection
- Connection stays open (WebSocket)
- Server pushes updates through open connection
- No need for server to initiate connections

### ✅ Meets Performance Requirements
- Persistent connection = low latency (<1.5s)
- No HTTP overhead per message
- Efficient binary protocol (gRPC + Protobuf)
- Can achieve 60 FPS target

### ✅ Provides Fault Tolerance
- Heartbeat mechanism detects failures
- Auto-reconnection on connection loss
- Server-side buffering during disconnections
- Graceful degradation

### ✅ Enables Bidirectional Control
- Training app can receive commands
- Dashboard can pause/resume training
- Adjust hyperparameters on the fly

## Connection Types Explained

### Option 1: WebSocket (Recommended for Web Dashboard)
```javascript
// Dashboard (Next.js)
const ws = new WebSocket('ws://localhost:8080/telemetry');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateImageGrid(data.images);
  updateLossChart(data.loss);
  updateFPS(data.fps);
};

ws.onclose = () => {
  // Auto-reconnect
  setTimeout(() => reconnect(), 1000);
};
```

### Option 2: gRPC-Web (More Complex, Better Type Safety)
```typescript
// Dashboard (Next.js)
const client = new TelemetryServiceClient('http://localhost:8080');
const stream = client.streamTelemetry();

stream.on('data', (response: TelemetryResponse) => {
  if (response.hasBatchData()) {
    updateImageGrid(response.batchData);
  }
});

stream.on('error', (err) => {
  // Auto-reconnect
  reconnect();
});
```

## Message Frequency Strategy

To hit 60 FPS while maintaining <1.5s latency:

```
High Frequency (60 Hz):
├─ BatchData (every batch)
│  └─ ~16 updates/second @ batch_size=16
│
Medium Frequency (6 Hz):
├─ PerformanceData (every 10 batches)
│  └─ FPS, timing, resources
│
Low Frequency (0.01 Hz):
├─ EpochData (once per epoch)
│  └─ Average metrics, convergence
│
Regular Interval (0.5 Hz):
└─ Heartbeat (every 2 seconds)
   └─ Connection health check
```

## Bandwidth Calculation

```
Per Batch (assuming 16 images @ 256x256 JPEG):
├─ Images: 16 × 30 KB = 480 KB
├─ Predictions: 16 × 100 B = 1.6 KB
├─ Metadata: ~1 KB
└─ Total: ~482 KB

At 60 FPS:
└─ 482 KB × 60 = ~28 MB/s (manageable on LAN)

Optimizations:
├─ Send only changed images (delta encoding)
├─ Lower JPEG quality (85% → 75%)
├─ Resize to 128×128 for small images
└─ Batch multiple updates in single message
```

## Implementation Checklist

- [ ] Generate gRPC code from proto
- [ ] Implement monitoring backend with bidirectional streaming
- [ ] Add WebSocket server for dashboard communication
- [ ] Create dashboard WebSocket client with auto-reconnect
- [ ] Implement heartbeat mechanism
- [ ] Add server-side buffering for fault tolerance
- [ ] Test with simulated network failures
- [ ] Optimize image compression
- [ ] Measure end-to-end latency
- [ ] Profile FPS consistency

## Testing Fault Tolerance

```bash
# Simulate network interruption
sudo iptables -A INPUT -p tcp --dport 8080 -j DROP
sleep 5
sudo iptables -D INPUT -p tcp --dport 8080 -j DROP

# Verify:
# ✓ Dashboard detects disconnection (via missing heartbeats)
# ✓ Dashboard attempts reconnection
# ✓ Backend buffers data during disconnection
# ✓ Dashboard catches up on reconnection
# ✓ Training continues uninterrupted
```

This architecture fully addresses your question: **the server doesn't ping the client; the client opens a persistent connection and the server pushes updates through it!**
