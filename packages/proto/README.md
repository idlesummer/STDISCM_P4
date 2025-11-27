# Telemetry gRPC Protocol Design

## Overview

This protocol defines the communication between the training application and the monitoring/dashboard system for real-time ML training visualization.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Training App   │────────►│ Monitoring       │────────►│  Dashboard  │
│  (PyTorch/TF)   │  gRPC   │ Backend (Python) │ WS/gRPC │  (Next.js)  │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

### Communication Patterns

1. **Training App ↔ Monitoring Backend**: Bidirectional gRPC streaming
2. **Monitoring Backend ↔ Dashboard**: WebSocket or gRPC-Web

## Key Design Decisions

### 1. Bidirectional Streaming
- **Why?** Allows server to send control commands (pause, stop, adjust LR) back to training
- **Fault Tolerance**: Both sides can detect connection drops via heartbeats
- **Low Latency**: Persistent connection eliminates handshake overhead

### 2. Image Data Transmission

```protobuf
message ImageData {
  bytes image_bytes = 1;  // JPEG/PNG encoded
  string format = 2;
  uint32 width = 3;
  uint32 height = 4;
}
```

**Rationale:**
- Specs require displaying actual images (16 tiles), not just metadata
- JPEG encoding reduces bandwidth (important for 60 FPS target)
- Flexibility to send different image sizes (specs: 32x32 to 512x512)

### 3. Structured Predictions

```protobuf
message Prediction {
  int32 predicted_class = 1;
  string predicted_label = 2;  // Human-readable
  float confidence = 3;
  repeated ClassScore top_k_scores = 4;  // Top-5 predictions
}
```

**Rationale:**
- UI mockup shows "Predicted label" text
- Confidence scores for visualization
- Top-k for debugging misclassifications

### 4. Frame Rate Tracking

```protobuf
message PerformanceData {
  float current_fps = 4;
  float average_fps = 5;
}
```

**Rationale:**
- Specs explicitly require: "The frame rate must be displayed at all times"
- Track both instantaneous and average FPS
- Critical for the 60 FPS performance requirement

### 5. Heartbeat Mechanism

```protobuf
message Heartbeat {
  uint64 timestamp_ms = 1;
  uint32 sequence_number = 2;
}
```

**Rationale:**
- Fault tolerance requirement in grading rubric
- Detect connection issues before critical failures
- Implement reconnection logic when heartbeats are missed

### 6. Oneof Pattern for Message Types

```protobuf
message TelemetryRequest {
  oneof payload {
    BatchData batch_data = 3;
    EpochData epoch_data = 4;
    PerformanceData performance_data = 5;
    StatusUpdate status_update = 6;
    Heartbeat heartbeat = 7;
  }
}
```

**Rationale:**
- Single stream for all telemetry types
- Type-safe message parsing
- Efficient serialization (only one payload type per message)

## Message Flow

### 1. Session Initialization

```
Training App                    Monitoring Backend
     │                                 │
     │──── RegisterTrainingSession ───►│
     │                                 │
     │◄─── SessionResponse ────────────│
     │    (session_id, config)         │
```

### 2. Training Loop

```
Training App                    Monitoring Backend
     │                                 │
     │──── StatusUpdate(RUNNING) ─────►│
     │                                 │
     │──── BatchData ─────────────────►│
     │                                 │
     │◄─── Acknowledgment ─────────────│
     │                                 │
     │──── PerformanceData ───────────►│
     │                                 │
     │──── Heartbeat ─────────────────►│
     │                                 │
     │──── EpochData ─────────────────►│
     │                                 │
     │◄─── ControlCommand(PAUSE) ──────│
     │                                 │
```

### 3. Fault Tolerance

```
Training App                    Monitoring Backend
     │                                 │
     │──── Heartbeat (seq=10) ────────►│
     │                                 │
     │  ✗✗✗ Network Issue ✗✗✗          │
     │                                 │
     │  (No heartbeat for 5 seconds)   │
     │                                 │
     │◄─── ErrorResponse ──────────────│
     │    (CONNECTION_TIMEOUT)         │
     │                                 │
     │──── [Reconnect] ───────────────►│
     │                                 │
     │──── StatusUpdate(RUNNING) ─────►│
     │                                 │
```

## Data Streaming Strategy

### Per Batch (High Frequency)
- `BatchData`: Every batch (up to 60 times/second for 60 FPS target)
  - Images (up to 16 images per specs)
  - Predictions and ground truth
  - Batch loss

### Per Epoch (Low Frequency)
- `EpochData`: Once per epoch
  - Average metrics
  - Convergence status
  - Learning rate updates

### Performance (Medium Frequency)
- `PerformanceData`: Every N batches (configurable, 1-10 batches per specs)
  - FPS metrics
  - Timing estimates
  - Resource usage

### Heartbeat (Regular Interval)
- `Heartbeat`: Every 1-2 seconds
  - Connection health monitoring
  - Enables fast failure detection

## Bandwidth Optimization

### Image Compression
```python
# Example: Compress images before sending
import cv2

def prepare_image_data(image_np, target_size=256):
    # Resize if needed
    if image_np.shape[0] > target_size:
        image_np = cv2.resize(image_np, (target_size, target_size))

    # JPEG encode (quality=85 for balance)
    _, buffer = cv2.imencode('.jpg', image_np, [cv2.IMWRITE_JPEG_QUALITY, 85])

    return ImageData(
        image_bytes=buffer.tobytes(),
        format="jpeg",
        width=target_size,
        height=target_size,
        channels=3
    )
```

### Selective Image Transmission
Per specs:
- Minimum batch size: 16 images
- If batch > 16: randomly select 16 images to display
- If batch < 16: aggregate mini-batches to reach 16 images

## Error Handling

### Client-Side (Training App)
```python
try:
    for response in stub.StreamTelemetry(request_iterator):
        if response.HasField('error'):
            handle_error(response.error)
        elif response.HasField('command'):
            execute_command(response.command)
except grpc.RpcError as e:
    if e.code() == grpc.StatusCode.UNAVAILABLE:
        # Implement exponential backoff retry
        reconnect_with_backoff()
```

### Server-Side (Monitoring Backend)
```python
def handle_telemetry_stream(request_iterator):
    last_heartbeat = time.time()

    for request in request_iterator:
        if time.time() - last_heartbeat > HEARTBEAT_TIMEOUT:
            yield TelemetryResponse(
                error=ErrorResponse(
                    code=ErrorCode.HEARTBEAT_TIMEOUT,
                    message="No heartbeat received"
                )
            )
            break

        if request.HasField('heartbeat'):
            last_heartbeat = time.time()
```

## Protocol Buffers Best Practices

1. **Use `optional` for truly optional fields**
   - `validation_loss`, `validation_accuracy` may not be available every epoch

2. **Use `repeated` for arrays**
   - `images`, `predictions`, `class_names`

3. **Use `oneof` for variant types**
   - Ensures only one payload type per message
   - Makes parsing type-safe

4. **Include timestamps**
   - All messages have `timestamp_ms` for debugging
   - Helps calculate latency

5. **Use enums for status codes**
   - Type-safe, self-documenting
   - Easy to extend

## Performance Targets (Per Specs)

| Metric | Target | Implementation |
|--------|--------|----------------|
| Frame Rate | 60 FPS (constant) | `PerformanceData.current_fps` |
| Latency | <1.5 seconds | Streaming + compression |
| Image Tiles | 16 images | `BatchData.images` (max 16) |
| Fault Tolerance | Auto-reconnect | Heartbeat + error recovery |

## Next Steps

1. **Generate code** for Python (backend) and TypeScript (frontend)
2. **Implement** bidirectional streaming in monitoring backend
3. **Create** WebSocket bridge for dashboard
4. **Add** fault tolerance and reconnection logic
5. **Test** with simulated network failures
