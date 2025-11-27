# P4 Project: gRPC Implementation Documentation

**Project**: Real-Time ML Training Monitoring System
**Date**: November 27, 2025
**Team**: STDISCM P4

---

## Table of Contents

1. [Proto Format: Procedures and Parameters](#1-proto-format-procedures-and-parameters)
2. [Proto Files Explanation](#2-proto-files-explanation)
3. [Generated Stub Files (Proof of gRPC Setup)](#3-generated-stub-files-proof-of-grpc-setup)

---

## 1. Proto Format: Procedures and Parameters

This section provides the `.proto` format of all procedures (RPC methods) and parameters (message types) used in our P4 project.

### Service Definition

```protobuf
syntax = "proto3";
package metrics;

service MetricsService {
  // Bidirectional streaming RPC for continuous metrics exchange
  rpc StreamMetrics(stream MetricsRequest) returns (stream MetricsResponse);

  // Unary RPC for initial session registration
  rpc RegisterTrainingSession(SessionInfo) returns (SessionResponse);
}
```

### Core Data Message Parameters

#### 1. BatchData (High Frequency ~60 FPS)

```protobuf
message BatchData {
  uint32 epoch = 1;                     // Current training epoch
  uint32 batch_idx = 2;                 // Batch index within epoch
  repeated ImageData images = 3;         // Up to 16 images
  repeated Prediction predictions = 4;   // Model predictions
  repeated int32 ground_truth = 5;       // True class labels
  float batch_loss = 6;                 // Batch loss value
}
```

**Purpose**: Sent after each training batch to provide real-time visualization data.

#### 2. ImageData

```protobuf
message ImageData {
  bytes image_bytes = 1;  // JPEG-encoded image data
}
```

**Purpose**: Contains JPEG-encoded image for bandwidth-efficient transmission.

#### 3. Prediction

```protobuf
message Prediction {
  int32 predicted_class = 1;  // Predicted class index
  float confidence = 2;       // Confidence score (0.0 - 1.0)
}
```

**Purpose**: Contains model prediction and confidence for each image.

#### 4. EpochData (Low Frequency)

```protobuf
message EpochData {
  uint32 epoch = 1;             // Epoch number
  float average_loss = 2;       // Average loss for epoch
  float average_accuracy = 3;   // Average accuracy for epoch
}
```

**Purpose**: Aggregate metrics sent at the end of each training epoch.

### Supporting Message Parameters

#### 5. PerformanceData

```protobuf
message PerformanceData {
  float time_per_batch_ms = 1;           // Avg time per batch (ms)
  float total_time_for_epoch_sec = 2;    // Total epoch time (sec)
  float estimated_time_remaining_sec = 3; // ETA
  float current_fps = 4;                 // Current FPS (REQUIRED)
  float average_fps = 5;                 // Average FPS
  optional ResourceUsage resource_usage = 6;
  uint64 timestamp_ms = 7;
}

message ResourceUsage {
  float cpu_percent = 1;      // CPU utilization %
  float memory_mb = 2;        // RAM usage (MB)
  float gpu_percent = 3;      // GPU utilization %
  float gpu_memory_mb = 4;    // GPU memory usage (MB)
}
```

**Purpose**: Track training performance and system resources. FPS display is a key requirement.

#### 6. StatusUpdate

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

message TrainingConfig {
  uint32 total_epochs = 1;
  uint32 batches_per_epoch = 2;
  uint32 batch_size = 3;
  string model_name = 4;
  string dataset_name = 5;
  repeated string class_names = 6;  // Class labels for predictions
}
```

**Purpose**: Communicate training lifecycle state changes.

#### 7. Session Management

```protobuf
message SessionInfo {
  string session_id = 1;
  string client_name = 2;        // E.g., "pytorch_trainer"
  string client_version = 3;
  TrainingConfig config = 4;
  uint64 timestamp_ms = 5;
}

message SessionResponse {
  bool success = 1;
  string session_id = 2;
  string message = 3;
  ServerConfig server_config = 4;
}

message ServerConfig {
  uint32 max_batch_size = 1;
  uint32 max_image_dimension = 2;    // Max 512x512 pixels
  uint32 heartbeat_interval_ms = 3;
  uint32 buffer_size = 4;
}
```

**Purpose**: Establish connection and negotiate capabilities between client and server.

#### 8. Request/Response Wrappers

```protobuf
message MetricsRequest {
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

message MetricsResponse {
  string session_id = 1;
  uint64 timestamp_ms = 2;

  oneof payload {
    Acknowledgment ack = 3;
    ControlCommand command = 4;
    ErrorResponse error = 5;
  }
}
```

**Purpose**: Wrap all messages for bidirectional streaming communication.

#### 9. Control and Error Handling

```protobuf
message Heartbeat {
  uint64 timestamp_ms = 1;
  uint32 sequence_number = 2;
}

message Acknowledgment {
  uint32 batch_idx = 1;
  bool success = 2;
}

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

**Purpose**: Connection health monitoring, acknowledgments, and error handling.

---

## 2. Proto Files Explanation

Our P4 project uses two `.proto` files, each serving a specific purpose in the architecture.

### 2.1 `metrics.proto` - Complete Protocol Definition

**Location**: `/packages/proto/metrics.proto`

**Purpose**: This is the **main protocol definition file** for our real-time ML training monitoring system. It defines the complete communication contract between the training backend (Python) and the dashboard (Next.js).

**Key Features**:
- **Service Definition**: Defines `MetricsService` with two RPC methods:
  - `StreamMetrics`: Bidirectional streaming for continuous data flow
  - `RegisterTrainingSession`: Initial handshake for session establishment

- **Message Types**: Contains all 15+ message types needed for:
  - Real-time batch data with images and predictions
  - Performance monitoring (FPS tracking)
  - Training status management
  - Session lifecycle management
  - Error handling and control commands

- **Usage in Project**:
  - Backend (Python): Generates `metrics_pb2.py` and `metrics_pb2_grpc.py`
  - Dashboard (Next.js): Can generate TypeScript definitions using `grpc-web`
  - Ensures type-safe communication between backend and frontend

**Why This File Exists**:
Our P4 project requires real-time visualization of ML training. This file defines the protocol that allows:
1. Training backend to stream images, predictions, and metrics at 60 FPS
2. Dashboard to display this data with <1.5 second latency
3. Bidirectional control (dashboard can pause/resume training)
4. Fault tolerance through heartbeats and error handling

### 2.2 `core_messages.proto` - Simplified Core Messages

**Location**: `/packages/proto/core_messages.proto`

**Purpose**: This file contains **only the 4 essential core data messages** extracted from `metrics.proto` for easier understanding and reference.

**Contains**:
```protobuf
- BatchData      // Per-batch metrics (6 fields)
- ImageData      // JPEG image data (1 field)
- Prediction     // Model predictions (2 fields)
- EpochData      // Epoch summaries (3 fields)
```

**Why This File Exists**:
- **Educational**: Simplifies understanding of the core protocol
- **Documentation**: Clear reference for the most important messages
- **Modular Testing**: Can generate stubs for just core messages
- **Team Communication**: Helps team members quickly understand the essential data flow

**Usage in Project**:
- Reference documentation for development team
- Can be used to generate minimal stubs for testing
- Serves as a simplified view of the protocol for stakeholders

**Relationship to metrics.proto**:
- `core_messages.proto` is a **subset** of `metrics.proto`
- These 4 messages are also fully defined in `metrics.proto`
- For production, we use `metrics.proto` (complete protocol)
- For documentation and learning, we reference `core_messages.proto`

### 2.3 Project Architecture Context

```
┌─────────────────────────────────────────────────────────────────┐
│                      P4 PROJECT ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐                 ┌──────────────────────┐
│  Training Backend       │                 │  Dashboard           │
│  (Python + PyTorch)     │                 │  (Next.js)           │
│                         │                 │                      │
│  ┌──────────────────┐   │   gRPC/WebSocket│  ┌────────────────┐ │
│  │ ML Training Loop │   │◄───────────────►│  │ Image Grid     │ │
│  │ - MNIST/CIFAR    │   │    60 FPS       │  │ (16 tiles)     │ │
│  │ - CNN Model      │   │                 │  ├────────────────┤ │
│  └──────────────────┘   │                 │  │ Loss Charts    │ │
│           │             │                 │  ├────────────────┤ │
│           ▼             │                 │  │ FPS Counter    │ │
│  ┌──────────────────┐   │                 │  ├────────────────┤ │
│  │ Metrics          │   │                 │  │ Predictions    │ │
│  │ Collection       │   │                 │  └────────────────┘ │
│  └──────────────────┘   │                 │                      │
│           │             │                 │                      │
│           ▼             │                 │                      │
│  ┌──────────────────┐   │                 │                      │
│  │ gRPC Server      │   │                 │                      │
│  │ (metrics_pb2)    │   │                 │                      │
│  └──────────────────┘   │                 │                      │
└─────────────────────────┘                 └──────────────────────┘
         Uses:                                     Uses:
    metrics.proto                           metrics.proto
    ↓                                       ↓
    metrics_pb2.py                          TypeScript stubs
    metrics_pb2_grpc.py                     (grpc-web)
```

**Proto files enable**:
- ✅ Type-safe communication
- ✅ Efficient binary serialization
- ✅ Cross-language compatibility (Python ↔ TypeScript)
- ✅ Automatic validation
- ✅ Version compatibility

---

## 3. Generated Stub Files (Proof of gRPC Setup)

This section demonstrates successful gRPC setup by showing the generated Python stub files from our `.proto` definitions.

### 3.1 Code Generation Command

```bash
# Generate Python stubs from metrics.proto
python3 -m grpc_tools.protoc \
  -I. \
  --python_out=. \
  --grpc_python_out=. \
  metrics.proto

# Generate Python stubs from core_messages.proto
python3 -m grpc_tools.protoc \
  -I. \
  --python_out=. \
  --grpc_python_out=. \
  core_messages.proto
```

**Output Files**:
- `metrics_pb2.py` (8.3 KB) - Message classes
- `metrics_pb2_grpc.py` (5.2 KB) - Service stubs (client & server)
- `core_messages_pb2.py` (2.1 KB) - Core message classes
- `core_messages_pb2_grpc.py` (893 B) - Minimal stub

### 3.2 Generated File: `core_messages_pb2.py`

**File**: `/packages/proto/core_messages_pb2.py`
**Size**: 2.1 KB
**Purpose**: Python message classes for core data types

```python
# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: core_messages.proto
# Protobuf Python Version: 6.31.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder

_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    6,
    31,
    1,
    '',
    'core_messages.proto'
)

_sym_db = _symbol_database.Default()

DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b'\n\x13core_messages.proto\x12\x07metrics\"'
    b'\xa5\x01\n\tBatchData\x12\r\n\x05epoch\x18\x01 \x01(\r'
    b'\x12\x11\n\tbatch_idx\x18\x02 \x01(\r'
    b'\x12\"\n\x06images\x18\x03 \x03(\x0b\x32\x12.metrics.ImageData'
    b'\x12(\n\x0bpredictions\x18\x04 \x03(\x0b\x32\x13.metrics.Prediction'
    b'\x12\x14\n\x0cground_truth\x18\x05 \x03(\x05'
    b'\x12\x12\n\nbatch_loss\x18\x06 \x01(\x02'
    b'\" \n\tImageData\x12\x13\n\x0bimage_bytes\x18\x01 \x01(\x0c'
    b'\"9\n\nPrediction\x12\x17\n\x0fpredicted_class\x18\x01 \x01(\x05'
    b'\x12\x12\n\nconfidence\x18\x02 \x01(\x02'
    b'\"J\n\tEpochData\x12\r\n\x05epoch\x18\x01 \x01(\r'
    b'\x12\x14\n\x0caverage_loss\x18\x02 \x01(\x02'
    b'\x12\x18\n\x10average_accuracy\x18\x03 \x01(\x02'
    b'b\x06proto3'
)

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'core_messages_pb2', _globals)

if not _descriptor._USE_C_DESCRIPTORS:
  DESCRIPTOR._loaded_options = None
  _globals['_BATCHDATA']._serialized_start=33
  _globals['_BATCHDATA']._serialized_end=198
  _globals['_IMAGEDATA']._serialized_start=200
  _globals['_IMAGEDATA']._serialized_end=232
  _globals['_PREDICTION']._serialized_start=234
  _globals['_PREDICTION']._serialized_end=291
  _globals['_EPOCHDATA']._serialized_start=293
  _globals['_EPOCHDATA']._serialized_end=367
```

**What This Proves**:
✅ Protocol Buffer compiler is correctly installed (`protoc` version 31.1)
✅ Python protobuf library is working (version 6.31.1)
✅ Message definitions are correctly parsed and compiled
✅ Binary serialization format is generated (see `AddSerializedFile`)

### 3.3 Generated File: `metrics_pb2_grpc.py`

**File**: `/packages/proto/metrics_pb2_grpc.py`
**Size**: 5.2 KB
**Purpose**: gRPC service stubs for client and server implementation

```python
# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc
import warnings
import metrics_pb2 as metrics__pb2

GRPC_GENERATED_VERSION = '1.76.0'
GRPC_VERSION = grpc.__version__

# Version validation code...

class MetricsServiceStub(object):
    """Main service definition for training metrics"""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.StreamMetrics = channel.stream_stream(
                '/metrics.MetricsService/StreamMetrics',
                request_serializer=metrics__pb2.MetricsRequest.SerializeToString,
                response_deserializer=metrics__pb2.MetricsResponse.FromString,
                _registered_method=True)
        self.RegisterTrainingSession = channel.unary_unary(
                '/metrics.MetricsService/RegisterTrainingSession',
                request_serializer=metrics__pb2.SessionInfo.SerializeToString,
                response_deserializer=metrics__pb2.SessionResponse.FromString,
                _registered_method=True)


class MetricsServiceServicer(object):
    """Main service definition for training metrics"""

    def StreamMetrics(self, request_iterator, context):
        """Bidirectional streaming: Training app sends metrics, receives control commands"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def RegisterTrainingSession(self, request, context):
        """Unary call for initial handshake/registration"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_MetricsServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'StreamMetrics': grpc.stream_stream_rpc_method_handler(
                    servicer.StreamMetrics,
                    request_deserializer=metrics__pb2.MetricsRequest.FromString,
                    response_serializer=metrics__pb2.MetricsResponse.SerializeToString,
            ),
            'RegisterTrainingSession': grpc.unary_unary_rpc_method_handler(
                    servicer.RegisterTrainingSession,
                    request_deserializer=metrics__pb2.SessionInfo.FromString,
                    response_serializer=metrics__pb2.SessionResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'metrics.MetricsService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('metrics.MetricsService', rpc_method_handlers)
```

**What This Proves**:
✅ gRPC Python library is correctly installed (version 1.76.0)
✅ Service definitions are correctly compiled
✅ Both client stub (`MetricsServiceStub`) and server base (`MetricsServiceServicer`) are generated
✅ RPC methods are correctly mapped:
  - `StreamMetrics`: Bidirectional streaming RPC
  - `RegisterTrainingSession`: Unary RPC
✅ Serialization/deserialization methods are automatically generated
✅ Server registration helpers are created (`add_MetricsServiceServicer_to_server`)

### 3.4 Usage Example: Server Implementation

Here's how we use the generated stubs in our Python backend:

```python
import grpc
from concurrent import futures
import metrics_pb2
import metrics_pb2_grpc

class MetricsServiceImpl(metrics_pb2_grpc.MetricsServiceServicer):
    """Implementation of MetricsService"""

    def __init__(self):
        self.sessions = {}

    def RegisterTrainingSession(self, request, context):
        """Handle session registration"""
        print(f"New session: {request.session_id}")
        print(f"Client: {request.client_name} v{request.client_version}")

        # Store session
        self.sessions[request.session_id] = request

        # Create response
        response = metrics_pb2.SessionResponse()
        response.success = True
        response.session_id = request.session_id
        response.message = "Session registered successfully"

        # Configure server limits
        response.server_config.max_batch_size = 16
        response.server_config.max_image_dimension = 512
        response.server_config.heartbeat_interval_ms = 2000
        response.server_config.buffer_size = 100

        return response

    def StreamMetrics(self, request_iterator, context):
        """Handle bidirectional streaming"""
        for request in request_iterator:
            # Process incoming data
            if request.HasField('batch_data'):
                batch = request.batch_data
                print(f"Received batch {batch.batch_idx} with {len(batch.images)} images")

                # Send acknowledgment
                response = metrics_pb2.MetricsResponse()
                response.session_id = request.session_id
                response.ack.batch_idx = batch.batch_idx
                response.ack.success = True
                yield response

def serve():
    """Start gRPC server"""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    metrics_pb2_grpc.add_MetricsServiceServicer_to_server(
        MetricsServiceImpl(), server
    )
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Server started on port 50051")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
```

### 3.5 Usage Example: Client Implementation

```python
import grpc
import metrics_pb2
import metrics_pb2_grpc
import time

def run_client():
    """Connect to gRPC server and stream metrics"""

    # Create channel and stub
    channel = grpc.insecure_channel('localhost:50051')
    stub = metrics_pb2_grpc.MetricsServiceStub(channel)

    # Register session
    session_info = metrics_pb2.SessionInfo()
    session_info.session_id = "train_001"
    session_info.client_name = "pytorch_trainer"
    session_info.client_version = "1.0.0"
    session_info.timestamp_ms = int(time.time() * 1000)

    response = stub.RegisterTrainingSession(session_info)
    print(f"Session registered: {response.message}")

    # Stream metrics
    def generate_requests():
        for batch_idx in range(10):
            request = metrics_pb2.MetricsRequest()
            request.session_id = "train_001"
            request.timestamp_ms = int(time.time() * 1000)

            # Create batch data
            batch = request.batch_data
            batch.epoch = 0
            batch.batch_idx = batch_idx
            batch.batch_loss = 0.5 - (batch_idx * 0.01)

            # Add dummy image
            img = batch.images.add()
            img.image_bytes = b'fake_jpeg_data'

            # Add prediction
            pred = batch.predictions.add()
            pred.predicted_class = 3
            pred.confidence = 0.95

            # Add ground truth
            batch.ground_truth.append(3)

            yield request
            time.sleep(0.1)  # Simulate batch processing time

    # Stream with bidirectional communication
    responses = stub.StreamMetrics(generate_requests())
    for response in responses:
        if response.HasField('ack'):
            print(f"Batch {response.ack.batch_idx} acknowledged")

if __name__ == '__main__':
    run_client()
```

### 3.6 Verification: Generated Files

```bash
$ ls -lh packages/proto/*.py
-rw-r--r-- 1 user user 2.1K Nov 27 09:52 core_messages_pb2.py
-rw-r--r-- 1 user user 893  Nov 27 09:52 core_messages_pb2_grpc.py
-rw-r--r-- 1 user user 8.3K Nov 27 09:52 metrics_pb2.py
-rw-r--r-- 1 user user 5.2K Nov 27 09:52 metrics_pb2_grpc.py
```

**Verification Checklist**:
- [x] Protocol Buffer compiler (protoc) version 31.1 installed
- [x] Python protobuf library version 6.31.1 working
- [x] gRPC Python library version 1.76.0 working
- [x] Message classes successfully generated (\_pb2.py files)
- [x] Service stubs successfully generated (\_pb2_grpc.py files)
- [x] Client stub class available (`MetricsServiceStub`)
- [x] Server servicer class available (`MetricsServiceServicer`)
- [x] Serialization methods working (`SerializeToString`, `FromString`)
- [x] Both unary and streaming RPCs supported

---

## Summary

This document has comprehensively addressed all three P4 requirements:

### ✅ Requirement 1: Proto Format
Provided complete `.proto` format for:
- 2 RPC procedures (`StreamMetrics`, `RegisterTrainingSession`)
- 15+ message types with full field definitions
- Enums for status codes and command types
- Request/response wrappers for streaming communication

### ✅ Requirement 2: Proto Files Explanation
Explained both `.proto` files:
- **metrics.proto**: Complete protocol (15+ messages, 2 services)
  - Purpose: Full communication protocol for ML monitoring
  - Usage: Production backend and dashboard

- **core_messages.proto**: Simplified core (4 messages)
  - Purpose: Educational reference and documentation
  - Usage: Team learning and testing

### ✅ Requirement 3: Generated Stub Files
Demonstrated successful gRPC setup with:
- Generated Python files (`metrics_pb2.py`, `metrics_pb2_grpc.py`)
- Proof of protoc version 31.1
- Proof of grpcio version 1.76.0
- Working serialization and RPC methods
- Example server and client implementations

**Project Status**: gRPC protocol fully designed, compiled, and ready for implementation in P4 ML training monitoring system.

---

## Files Reference

| File | Location | Purpose |
|------|----------|---------|
| `metrics.proto` | `/packages/proto/metrics.proto` | Complete protocol definition |
| `core_messages.proto` | `/packages/proto/core_messages.proto` | Simplified core messages |
| `metrics_pb2.py` | `/packages/proto/metrics_pb2.py` | Generated message classes |
| `metrics_pb2_grpc.py` | `/packages/proto/metrics_pb2_grpc.py` | Generated service stubs |
| `core_messages_pb2.py` | `/packages/proto/core_messages_pb2.py` | Core message classes |
| `CORE_DATA_MESSAGES.md` | `/packages/proto/CORE_DATA_MESSAGES.md` | Detailed usage guide |
| `MESSAGE_TYPES.md` | `/packages/proto/MESSAGE_TYPES.md` | Message type reference |
| `GRPC_PROPOSAL.md` | `/GRPC_PROPOSAL.md` | Architecture overview |
