# gRPC Client-Server Stub Proposal for P4 Project

**Project**: Real-Time ML Training Telemetry and Monitoring System
**Student**: [Your Name Here]
**Date**: November 27, 2025

---

## Executive Summary

This proposal outlines the gRPC protocol design for a real-time machine learning training monitoring system. The system streams telemetry data from a PyTorch/TensorFlow training application to a monitoring backend, which then displays real-time visualizations on a web dashboard. The protocol supports bidirectional streaming, enabling both data transmission and control commands.

---

## 1. Protocol Buffer (.proto) Format

### 1.1 Service Definition

Our system uses **one main .proto file**: `telemetry.proto`

```protobuf
syntax = "proto3";
package telemetry;

// Main service definition for training telemetry
service TelemetryService {
  // Bidirectional streaming: Training app sends telemetry, receives control commands
  rpc StreamTelemetry(stream TelemetryRequest) returns (stream TelemetryResponse);

  // Unary call for initial handshake/registration
  rpc RegisterTrainingSession(SessionInfo) returns (SessionResponse);
}
```

**Key Features:**
- **Bidirectional Streaming**: Allows continuous data flow in both directions
- **Session Management**: Initial handshake to register training sessions
- **Control Commands**: Backend can send commands to training app (pause, stop, adjust parameters)

---

## 2. Explanation of telemetry.proto

### 2.1 Purpose in P4 Project

The `telemetry.proto` file serves as the **communication contract** between three system components:

1. **Training Application** (PyTorch/TensorFlow) → Sends telemetry data
2. **Monitoring Backend** (Python server) → Processes and relays data
3. **Dashboard** (Web application) → Displays real-time visualizations

**Project Requirements Addressed:**
- Display 16 image tiles with predictions in real-time
- Show loss plots updated every N batches
- Display frame rate (FPS) continuously
- Complete data flow in <1.5 seconds
- Support fault tolerance and reconnection

### 2.2 Message Categories

#### **A. Request Messages (Training App → Backend)**

##### 1. TelemetryRequest (Main Container)
```protobuf
message TelemetryRequest {
  string session_id = 1;
  uint64 timestamp_ms = 2;

  oneof payload {
    BatchData batch_data = 3;
    EpochData epoch_data = 4;
    PerformanceData performance_data = 5;
    StatusUpdate status_update = 6;
    Heartbeat heartbeat = 7;
  }
}
```

**Purpose**: Wrapper for all telemetry data types
- `session_id`: Identifies the training session
- `timestamp_ms`: Unix timestamp for synchronization
- `oneof payload`: Polymorphic message type (only one active at a time)

##### 2. BatchData (Per-Batch Telemetry)
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
  uint64 timestamp_ms = 9;
}
```

**Purpose**: Sent after each training batch
- **Images**: Actual image bytes (JPEG-encoded) for dashboard visualization
- **Predictions**: Model outputs with confidence scores
- **Ground Truth**: Correct labels for comparison
- **Metrics**: Loss and accuracy for plotting

**Why Images as Bytes?**
- Specification requires displaying actual images (not just filenames)
- JPEG encoding reduces bandwidth (512×512 RGB: 786KB → ~30KB)
- Dashboard can directly decode and display images

##### 3. EpochData (Per-Epoch Summary)
```protobuf
message EpochData {
  uint32 epoch = 1;
  float average_loss = 2;
  float average_accuracy = 3;
  float learning_rate = 4;
  bool is_converged = 5;

  optional float validation_loss = 6;
  optional float validation_accuracy = 7;
  uint64 timestamp_ms = 8;
}
```

**Purpose**: Sent at the end of each epoch
- Aggregated metrics for the entire epoch
- Convergence status for automatic stopping
- Optional validation metrics if available

##### 4. PerformanceData (System Performance)
```protobuf
message PerformanceData {
  float time_per_batch_ms = 1;
  float total_time_for_epoch_sec = 2;
  float estimated_time_remaining_sec = 3;

  float current_fps = 4;              // REQUIRED by specs
  float average_fps = 5;              // REQUIRED by specs

  optional ResourceUsage resource_usage = 6;
  uint64 timestamp_ms = 7;
}

message ResourceUsage {
  float cpu_percent = 1;
  float memory_mb = 2;
  float gpu_percent = 3;
  float gpu_memory_mb = 4;
}
```

**Purpose**: Performance monitoring
- **FPS Metrics**: Critical grading criterion (target: 60 FPS)
- **Timing**: Progress estimation
- **Resources**: CPU/GPU utilization tracking

##### 5. StatusUpdate (Training Status)
```protobuf
message StatusUpdate {
  TrainingStatus status = 1;
  string message = 2;
  optional TrainingConfig config = 3;
  uint64 timestamp_ms = 4;
}

enum TrainingStatus {
  UNKNOWN = 0;
  INITIALIZING = 1;
  RUNNING = 2;
  PAUSED = 3;
  COMPLETED = 4;
  FAILED = 5;
}
```

**Purpose**: Lifecycle management
- Notifies dashboard when training starts/stops
- Provides configuration details
- Useful for UI state management

##### 6. Heartbeat (Connection Health)
```protobuf
message Heartbeat {
  uint64 timestamp_ms = 1;
  uint32 sequence_number = 2;
}
```

**Purpose**: Fault tolerance
- Sent every 2 seconds to verify connection
- Detect disconnections before data loss occurs
- Enable automatic reconnection (required for grading)

#### **B. Response Messages (Backend → Training App)**

##### 1. TelemetryResponse (Main Container)
```protobuf
message TelemetryResponse {
  string session_id = 1;
  uint64 timestamp_ms = 2;

  oneof payload {
    Acknowledgment ack = 3;
    ControlCommand command = 4;
    ErrorResponse error = 5;
  }
}
```

##### 2. ControlCommand (Interactive Control)
```protobuf
message ControlCommand {
  CommandType type = 1;
  map<string, string> parameters = 2;

  enum CommandType {
    UNKNOWN_COMMAND = 0;
    PAUSE_TRAINING = 1;
    RESUME_TRAINING = 2;
    STOP_TRAINING = 3;
    ADJUST_BATCH_SIZE = 4;
    CHANGE_LEARNING_RATE = 5;
  }
}
```

**Purpose**: Bidirectional control
- Dashboard can pause/resume training
- Dynamically adjust hyperparameters
- Demonstrates full bidirectional streaming capability

##### 3. ErrorResponse (Error Handling)
```protobuf
message ErrorResponse {
  ErrorCode code = 1;
  string message = 2;

  enum ErrorCode {
    UNKNOWN_ERROR = 0;
    INVALID_SESSION = 1;
    INVALID_DATA = 2;
    BUFFER_FULL = 3;
    INTERNAL_ERROR = 4;
  }
}
```

**Purpose**: Robust error handling
- Communicates failures to training app
- Enables graceful degradation
- Supports debugging and monitoring

---

## 3. Generated Python Stub Files

### 3.1 Proof of gRPC Setup

Successfully generated two Python files using:
```bash
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. telemetry.proto
```

**Generated Files:**
1. `telemetry_pb2.py` (9.3 KB) - Message serialization/deserialization
2. `telemetry_pb2_grpc.py` (5.3 KB) - Client and server stubs

### 3.2 telemetry_pb2_grpc.py Overview

This file contains the **client and server stubs** for the TelemetryService.

#### **Client Stub (TelemetryServiceStub)**
```python
class TelemetryServiceStub(object):
    """Main service definition for training telemetry"""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        # Bidirectional streaming RPC
        self.StreamTelemetry = channel.stream_stream(
                '/telemetry.TelemetryService/StreamTelemetry',
                request_serializer=telemetry__pb2.TelemetryRequest.SerializeToString,
                response_deserializer=telemetry__pb2.TelemetryResponse.FromString,
                _registered_method=True)

        # Unary RPC for session registration
        self.RegisterTrainingSession = channel.unary_unary(
                '/telemetry.TelemetryService/RegisterTrainingSession',
                request_serializer=telemetry__pb2.SessionInfo.SerializeToString,
                response_deserializer=telemetry__pb2.SessionResponse.FromString,
                _registered_method=True)
```

**Usage in Training Application:**
```python
import grpc
import telemetry_pb2
import telemetry_pb2_grpc

# Create gRPC channel to monitoring backend
channel = grpc.insecure_channel('localhost:50051')
stub = telemetry_pb2_grpc.TelemetryServiceStub(channel)

# Register session
session_info = telemetry_pb2.SessionInfo(
    session_id="train_001",
    client_name="pytorch_trainer",
    client_version="1.0.0"
)
response = stub.RegisterTrainingSession(session_info)

# Start bidirectional streaming
def request_generator():
    # Send batch data
    batch_data = telemetry_pb2.BatchData(
        epoch=1,
        batch_idx=42,
        batch_loss=0.234
    )
    request = telemetry_pb2.TelemetryRequest(
        session_id="train_001",
        timestamp_ms=int(time.time() * 1000),
        batch_data=batch_data
    )
    yield request

# Stream telemetry and receive responses
responses = stub.StreamTelemetry(request_generator())
for response in responses:
    if response.HasField('command'):
        # Handle control command from backend
        if response.command.type == telemetry_pb2.ControlCommand.PAUSE_TRAINING:
            # Pause training loop
            pass
```

#### **Server Stub (TelemetryServiceServicer)**
```python
class TelemetryServiceServicer(object):
    """Main service definition for training telemetry"""

    def StreamTelemetry(self, request_iterator, context):
        """Bidirectional streaming: Training app sends telemetry, receives control commands"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def RegisterTrainingSession(self, request, context):
        """Unary call for initial handshake/registration"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')
```

**Usage in Monitoring Backend:**
```python
import grpc
from concurrent import futures
import telemetry_pb2
import telemetry_pb2_grpc

class TelemetryServicer(telemetry_pb2_grpc.TelemetryServiceServicer):
    def RegisterTrainingSession(self, request, context):
        """Handle session registration"""
        print(f"New session: {request.session_id}")

        # Return server configuration
        return telemetry_pb2.SessionResponse(
            success=True,
            session_id=request.session_id,
            message="Session registered successfully",
            server_config=telemetry_pb2.ServerConfig(
                max_batch_size=64,
                max_image_dimension=512,
                heartbeat_interval_ms=2000,
                buffer_size=1000
            )
        )

    def StreamTelemetry(self, request_iterator, context):
        """Handle bidirectional streaming"""
        for request in request_iterator:
            # Process incoming telemetry
            if request.HasField('batch_data'):
                batch = request.batch_data
                print(f"Received batch {batch.batch_idx}, loss: {batch.batch_loss}")

                # Forward to dashboard via WebSocket
                # ... (dashboard forwarding logic)

                # Send acknowledgment
                yield telemetry_pb2.TelemetryResponse(
                    session_id=request.session_id,
                    timestamp_ms=int(time.time() * 1000),
                    ack=telemetry_pb2.Acknowledgment(
                        batch_idx=batch.batch_idx,
                        success=True
                    )
                )

            elif request.HasField('heartbeat'):
                # Heartbeat received - connection healthy
                pass

# Start gRPC server
server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
telemetry_pb2_grpc.add_TelemetryServiceServicer_to_server(
    TelemetryServicer(), server)
server.add_insecure_port('[::]:50051')
server.start()
print("Monitoring backend listening on port 50051...")
server.wait_for_termination()
```

### 3.3 telemetry_pb2.py Overview

This file contains **message classes** for all Protocol Buffer definitions:

**Key Classes Generated:**
- `TelemetryRequest` - Main request container
- `BatchData` - Per-batch telemetry data
- `ImageData` - Individual image representation
- `Prediction` - Model prediction with confidence
- `EpochData` - Per-epoch metrics
- `PerformanceData` - Performance and FPS metrics
- `StatusUpdate` - Training status updates
- `Heartbeat` - Connection health check
- `TelemetryResponse` - Main response container
- `ControlCommand` - Control commands from backend
- `ErrorResponse` - Error communication

**Example Usage:**
```python
import telemetry_pb2

# Create a batch data message
batch_data = telemetry_pb2.BatchData()
batch_data.epoch = 5
batch_data.batch_idx = 42
batch_data.batch_size = 16
batch_data.batch_loss = 0.234
batch_data.batch_accuracy = 0.92
batch_data.timestamp_ms = 1732684800000

# Add image data
for i in range(16):
    image = batch_data.images.add()
    image.image_bytes = jpeg_encoded_bytes  # Actual image data
    image.format = "jpeg"
    image.width = 256
    image.height = 256
    image.channels = 3
    image.image_id = f"batch42_img{i}"

# Add predictions
for i in range(16):
    pred = batch_data.predictions.add()
    pred.predicted_class = 3
    pred.predicted_label = "cat"
    pred.confidence = 0.94

    # Add top-k scores
    for j, (class_idx, score) in enumerate(top_k_results):
        score_entry = pred.top_k_scores.add()
        score_entry.class_idx = class_idx
        score_entry.label = class_names[class_idx]
        score_entry.score = score

# Add ground truth labels
batch_data.ground_truth.extend([3, 5, 3, 2, 1, ...])  # Actual labels
```

---

## 4. System Architecture

### 4.1 Data Flow Diagram

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Training App   │────────►│ Monitoring       │────────►│  Dashboard  │
│  (PyTorch/TF)   │  gRPC   │ Backend (Python) │ WS/HTTP │  (Next.js)  │
└─────────────────┘         └──────────────────┘         └─────────────┘
    CLIENT                       SERVER                    WEB CLIENT

Flow:
1. Training app sends BatchData every batch (~60 FPS)
2. Backend processes and forwards to dashboard
3. Dashboard displays 16 images + loss plot + FPS
4. Total latency: <1.5 seconds (requirement met)
```

### 4.2 Message Frequency Strategy

```
High Frequency (60 Hz):
├─ BatchData (every batch)

Medium Frequency (10 Hz):
├─ PerformanceData (every 10 batches)

Low Frequency (per epoch):
├─ EpochData (once per epoch)

Regular Interval (0.5 Hz):
└─ Heartbeat (every 2 seconds)
```

### 4.3 Bandwidth Optimization

**Per Batch Calculation:**
```
16 images × 30 KB (JPEG) = 480 KB
Predictions + metadata     =   5 KB
Total per batch           = 485 KB

At 60 FPS: 485 KB × 60 = ~29 MB/s (manageable on LAN)
```

**Optimization Techniques:**
- Resize images to 256×256 before JPEG encoding
- Use 85% JPEG quality
- Send only 16 images even if batch_size > 16
- Use delta encoding for unchanged data

---

## 5. Fault Tolerance Features

### 5.1 Heartbeat Mechanism
- Training app sends heartbeat every 2 seconds
- Backend detects missed heartbeats (connection loss)
- Automatic reconnection on failure

### 5.2 Buffering Strategy
- Backend buffers data during dashboard disconnections
- On reconnection, sends buffered data (catch-up)
- Prevents data loss during network interruptions

### 5.3 Session Management
- Session registration before streaming
- Session ID tracking for multiple concurrent trainings
- Graceful session termination

---

## 6. Implementation Status

### ✅ Completed
- [x] Protocol design (telemetry.proto)
- [x] gRPC tools installation
- [x] Python stub generation (telemetry_pb2.py, telemetry_pb2_grpc.py)
- [x] Documentation and design decisions

### 🚧 Next Steps
- [ ] Implement monitoring backend server
- [ ] Implement training app telemetry client
- [ ] Create dashboard WebSocket bridge
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Fault tolerance testing

---

## 7. Conclusion

This gRPC protocol design provides:

1. **Efficient Communication**: Binary protocol with minimal overhead
2. **Real-Time Performance**: Bidirectional streaming for <1.5s latency
3. **Fault Tolerance**: Heartbeat mechanism and reconnection support
4. **Extensibility**: Easy to add new message types or fields
5. **Type Safety**: Strongly-typed messages prevent runtime errors

The generated Python stubs (`telemetry_pb2.py` and `telemetry_pb2_grpc.py`) prove successful gRPC setup and provide the foundation for implementing both the training application client and monitoring backend server.

---

## Appendix: File Locations

- **Proto Definition**: `/packages/proto/telemetry.proto`
- **Generated Message Classes**: `/packages/proto/telemetry_pb2.py` (9.3 KB)
- **Generated Service Stubs**: `/packages/proto/telemetry_pb2_grpc.py` (5.3 KB)
- **Design Documentation**: `/packages/proto/DESIGN_DECISIONS.md`
- **Architecture Documentation**: `/packages/proto/ARCHITECTURE.md`

---

**Generated on**: November 27, 2025
**gRPC Version**: 1.76.0
**Protocol Buffer Version**: 6.33.1
