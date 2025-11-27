# gRPC Protocol Proposal for P4 Project

**Project**: Real-Time ML Training Monitoring System
**Date**: November 27, 2025

---

## Executive Summary

This proposal outlines the gRPC protocol design for a real-time machine learning training monitoring system. The system consists of **two main components**:

1. **Training Backend** (Python) - Combines ML training and monitoring server
2. **Dashboard** (Next.js) - Web interface for visualization

The `metrics.proto` file defines the communication protocol between these components, enabling real-time visualization of training metrics, images, and predictions.

---

## System Architecture

### 2-Tier Architecture

```
┌─────────────────────────────┐         ┌─────────────┐
│  Training + Monitoring      │────────►│  Dashboard  │
│  Backend (Python)           │ WS/gRPC │  (Next.js)  │
│                             │         │             │
│  - PyTorch/TensorFlow       │         │  - Image    │
│  - Model Training           │         │    Grid     │
│  - Metrics Collection       │         │  - Loss     │
│  - gRPC Server              │         │    Plots    │
│                             │         │  - FPS      │
└─────────────────────────────┘         └─────────────┘
     gRPC SERVER                            CLIENT
```

**Key Points:**
- Training and monitoring are **one unified Python application**
- The backend performs training AND serves metrics data
- The dashboard connects to the backend to receive real-time updates
- Communication uses either WebSocket or gRPC-Web (browser-compatible)

---

## Protocol Definition: metrics.proto

### Service Definition

```protobuf
service MetricsService {
  // Stream metrics data from backend to dashboard
  rpc StreamMetrics(stream MetricsRequest) returns (stream MetricsResponse);

  // Initial session registration
  rpc RegisterTrainingSession(SessionInfo) returns (SessionResponse);
}
```

**Purpose:**
- `StreamMetrics`: Bidirectional streaming for continuous data flow
- `RegisterTrainingSession`: Initial handshake to establish connection

---

## Message Types

### 1. BatchData (High Frequency ~60 FPS)

Sent after each training batch to update the dashboard in real-time.

```protobuf
message BatchData {
  uint32 epoch = 1;
  uint32 batch_idx = 2;
  uint32 batch_size = 3;

  repeated ImageData images = 4;          // Up to 16 images
  repeated Prediction predictions = 5;    // Model predictions
  repeated int32 ground_truth = 6;        // Actual labels

  float batch_loss = 7;
  float batch_accuracy = 8;
}
```

**Contains:**
- 16 training images (JPEG-encoded for bandwidth efficiency)
- Model predictions with confidence scores
- Ground truth labels for comparison
- Training metrics (loss, accuracy)

### 2. EpochData (Low Frequency ~1/epoch)

Sent at the end of each training epoch for aggregate metrics.

```protobuf
message EpochData {
  uint32 epoch = 1;
  float average_loss = 2;
  float average_accuracy = 3;
  float learning_rate = 4;

  optional float validation_loss = 6;
  optional float validation_accuracy = 7;
}
```

### 3. PerformanceData (Medium Frequency)

Tracks system performance and frame rate.

```protobuf
message PerformanceData {
  float time_per_batch_ms = 1;
  float current_fps = 4;              // REQUIRED: Display constantly
  float average_fps = 5;

  optional ResourceUsage resource_usage = 6;
}
```

**Critical for specs:**
- FPS must be displayed at all times
- Target: 60 FPS constant
- Latency goal: <1.5 seconds end-to-end

### 4. StatusUpdate

Notifies dashboard of training state changes.

```protobuf
message StatusUpdate {
  TrainingStatus status = 1;  // INITIALIZING, RUNNING, PAUSED, COMPLETED, FAILED
  string message = 2;
  optional TrainingConfig config = 3;
}
```

### 5. Heartbeat

Connection health monitoring for fault tolerance.

```protobuf
message Heartbeat {
  uint64 timestamp_ms = 1;
  uint32 sequence_number = 2;
}
```

---

## Data Flow

### Connection Establishment

```
Dashboard                          Training Backend
   │                                      │
   │──── Connect (WS/gRPC-Web) ──────────►│
   │                                      │
   │◄─── Connection Established ──────────│
   │                                      │
   │──── RegisterTrainingSession ────────►│
   │                                      │
   │◄─── SessionResponse ─────────────────│
   │     (session_id, config)             │
```

### Training Loop

```
Dashboard                          Training Backend
   │                                      │
   │                                      │  [Training starts]
   │◄─── StatusUpdate(RUNNING) ───────────│
   │                                      │
   │◄─── BatchData ───────────────────────│  [Every batch]
   │     (16 images, predictions, loss)   │
   │                                      │
   │◄─── PerformanceData ─────────────────│  [Every N batches]
   │     (FPS: 58.2)                      │
   │                                      │
   │──── Heartbeat ───────────────────────►│  [Every 2 seconds]
   │                                      │
   │◄─── EpochData ───────────────────────│  [End of epoch]
   │     (avg metrics)                    │
```

### Bidirectional Control (Optional)

The dashboard can send control commands back to the training backend:

```
Dashboard                          Training Backend
   │                                      │
   │──── ControlCommand(PAUSE) ───────────►│
   │                                      │
   │◄─── StatusUpdate(PAUSED) ────────────│
   │                                      │
   │──── ControlCommand(RESUME) ──────────►│
   │                                      │
   │◄─── StatusUpdate(RUNNING) ───────────│
```

---

## Implementation Details

### Backend (Python)

The backend is a single Python application that:
1. Performs ML training (PyTorch/TensorFlow)
2. Collects metrics data during training
3. Serves as a gRPC server (or WebSocket server)
4. Streams data to connected dashboards

```python
# Example: Backend server structure
class TrainingBackend:
    def __init__(self):
        self.model = load_model()
        self.grpc_server = create_grpc_server()

    def train(self):
        for epoch in range(num_epochs):
            for batch in dataloader:
                # Train model
                loss = train_batch(batch)

                # Collect metrics
                metrics = create_batch_data(batch, predictions, loss)

                # Stream to dashboard
                self.stream_to_clients(metrics)
```

### Dashboard (Next.js)

The dashboard connects to the backend and receives real-time updates:

```typescript
// Example: Dashboard client
const client = new MetricsServiceClient('http://localhost:50051');

const stream = client.streamMetrics();

stream.on('data', (response) => {
  if (response.hasBatchData()) {
    updateImageGrid(response.batchData.images);
    updateLossChart(response.batchData.batchLoss);
  }
  if (response.hasPerformanceData()) {
    updateFPS(response.performanceData.currentFps);
  }
});
```

---

## Key Features

### 1. Efficient Image Transmission

Images are JPEG-encoded before transmission:
- Original: 256×256×3 RGB = 196 KB
- JPEG (85% quality): ~30 KB
- 16 images per batch: ~480 KB

At 60 FPS: ~29 MB/s bandwidth (manageable on LAN)

### 2. Fault Tolerance

- **Heartbeat mechanism**: Detect connection failures
- **Auto-reconnection**: Dashboard automatically reconnects
- **Buffering**: Backend can buffer data during disconnections

### 3. Real-Time Performance

- **Persistent connection**: No HTTP handshake overhead
- **Binary protocol**: Efficient serialization with Protocol Buffers
- **Target latency**: <1.5 seconds end-to-end
- **Target FPS**: 60 FPS constant

### 4. Type Safety

Protocol Buffers provide:
- Strongly-typed messages
- Automatic validation
- Cross-language compatibility
- Version compatibility

---

## Generated Stub Files

Successfully generated Python stubs from `metrics.proto`:

```bash
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. metrics.proto
```

**Generated Files:**
- `metrics_pb2.py` (9.3 KB) - Message classes
- `metrics_pb2_grpc.py` (5.3 KB) - Server and client stubs

**Usage in Backend:**
```python
import metrics_pb2_grpc

class MetricsServicer(metrics_pb2_grpc.MetricsServiceServicer):
    def StreamMetrics(self, request_iterator, context):
        # Handle incoming requests from dashboard
        for request in request_iterator:
            # Send metrics responses
            yield create_response(request)
```

**Usage in Dashboard:**
```typescript
// TypeScript stubs can be generated using grpc-web
import { MetricsServiceClient } from './metrics_grpc_web_pb';

const client = new MetricsServiceClient('http://localhost:8080');
```

---

## Project Requirements Met

| Requirement | Implementation |
|-------------|----------------|
| Display 16 image tiles | `BatchData.images` (up to 16 per batch) |
| Show predictions | `Prediction` messages with confidence scores |
| Loss plots | `BatchData.batch_loss` updated every batch |
| FPS display | `PerformanceData.current_fps` (constant) |
| <1.5s latency | Persistent streaming connection |
| Fault tolerance | Heartbeat + auto-reconnection |
| 60 FPS target | Optimized batch streaming |

---

## Next Steps

### Implementation Tasks

1. **Backend Implementation**
   - [ ] Integrate gRPC server with training loop
   - [ ] Implement metrics collection
   - [ ] Add image encoding (JPEG compression)
   - [ ] Implement heartbeat mechanism

2. **Dashboard Implementation**
   - [ ] Create gRPC-Web or WebSocket client
   - [ ] Build image grid component (16 tiles)
   - [ ] Create real-time loss chart
   - [ ] Display FPS counter
   - [ ] Implement auto-reconnection

3. **Testing**
   - [ ] End-to-end latency testing
   - [ ] FPS consistency testing
   - [ ] Fault tolerance testing (network failures)
   - [ ] Load testing (sustained 60 FPS)

---

## Conclusion

This simplified 2-tier architecture:

- **Combines training and monitoring** in a single Python backend
- **Uses gRPC/WebSocket** for efficient real-time communication
- **Meets all project requirements** (images, predictions, FPS, latency)
- **Provides fault tolerance** through heartbeats and reconnection
- **Scales efficiently** with binary protocol and compression

The `metrics.proto` file serves as the contract between the backend and dashboard, ensuring type-safe, efficient, and reliable communication for real-time ML training visualization.

---

**Files:**
- Protocol Definition: `/packages/proto/metrics.proto`
- Generated Stubs: `/packages/proto/metrics_pb2.py`, `metrics_pb2_grpc.py`
- Architecture Docs: `/packages/proto/ARCHITECTURE.md`
