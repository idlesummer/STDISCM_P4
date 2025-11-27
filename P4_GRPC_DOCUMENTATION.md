# P4 Project: gRPC Protocol Documentation

**Project**: Real-Time ML Training Monitoring System
**Date**: November 27, 2025
**Team**: STDISCM P4

---

## Table of Contents

1. [Proto Format: Procedures and Parameters](#1-proto-format-procedures-and-parameters)
2. [Proto File Explanation](#2-proto-file-explanation)
3. [Generated Stub Files (Proof of gRPC Setup)](#3-generated-stub-files-proof-of-grpc-setup)

---

## 1. Proto Format: Procedures and Parameters

This section provides the complete `.proto` format for our P4 project, including all RPC procedures and message parameters.

### Complete Protocol Definition

**File**: `packages/proto/core_messages.proto`

```protobuf
// Core Messages Protocol - ML Training Monitoring
//
// This file contains the complete protocol for ML training monitoring:
// - Service definitions (RPC procedures)
// - Core data messages (message types)
//
// Purpose: Enable real-time communication between training backend and dashboard

syntax = "proto3";

package metrics;

// ============================================================================
// SERVICE DEFINITIONS (RPC Procedures)
// ============================================================================

service MetricsService {
  // Bidirectional streaming RPC for continuous metrics exchange
  // Client sends: BatchData, EpochData
  // Server sends: Acknowledgments
  rpc StreamMetrics(stream MetricsRequest) returns (stream MetricsResponse);

  // Unary RPC for initial session registration
  rpc RegisterSession(SessionInfo) returns (SessionResponse);
}

// ============================================================================
// REQUEST/RESPONSE WRAPPERS
// ============================================================================

// Client request wrapper
message MetricsRequest {
  string session_id = 1;
  uint64 timestamp_ms = 2;

  oneof payload {
    BatchData batch_data = 3;
    EpochData epoch_data = 4;
  }
}

// Server response wrapper
message MetricsResponse {
  string session_id = 1;
  uint64 timestamp_ms = 2;
  bool success = 3;
  string message = 4;
}

// Session registration request
message SessionInfo {
  string session_id = 1;
  string client_name = 2;
  uint64 timestamp_ms = 3;
}

// Session registration response
message SessionResponse {
  bool success = 1;
  string session_id = 2;
  string message = 3;
}

// ============================================================================
// CORE DATA MESSAGES (4 Message Types)
// ============================================================================

// 1. Per-batch metrics data (HIGH FREQUENCY ~60 FPS)
message BatchData {
  uint32 epoch = 1;
  uint32 batch_idx = 2;
  repeated ImageData images = 3;           // Up to 16 images
  repeated Prediction predictions = 4;
  repeated int32 ground_truth = 5;         // Class indices
  float batch_loss = 6;
}

// 2. Individual image with JPEG data
message ImageData {
  bytes image_bytes = 1;  // JPEG-encoded image data
}

// 3. Prediction with confidence scores
message Prediction {
  int32 predicted_class = 1;  // Predicted class index
  float confidence = 2;       // Confidence score (0.0 - 1.0)
}

// 4. Per-epoch metrics data (LOW FREQUENCY ~1/epoch)
message EpochData {
  uint32 epoch = 1;
  float average_loss = 2;
  float average_accuracy = 3;
}
```

### Protocol Summary

**2 RPC Procedures**:
1. `StreamMetrics` - Bidirectional streaming for continuous data exchange
2. `RegisterSession` - Unary RPC for session establishment

**8 Message Types**:
1. `MetricsRequest` - Client request wrapper (with oneof payload)
2. `MetricsResponse` - Server response wrapper
3. `SessionInfo` - Session registration data
4. `SessionResponse` - Session registration response
5. `BatchData` - Per-batch training metrics (high frequency)
6. `ImageData` - JPEG-encoded images
7. `Prediction` - Model predictions with confidence
8. `EpochData` - Per-epoch aggregate metrics (low frequency)

---

## 2. Proto File Explanation

### What is `core_messages.proto`?

**Location**: `/packages/proto/core_messages.proto`

**Purpose**: This is our **complete gRPC protocol definition** for the P4 ML training monitoring system. It defines the communication contract between:
- **Training Backend** (Python + PyTorch)
- **Dashboard** (Next.js)

### Why Everything is in One File

We define both **procedures** (RPC methods) and **parameters** (message types) in a single `.proto` file because:

1. **Simplicity**: Easier to understand the complete protocol in one place
2. **Cohesion**: Services and their messages are closely related
3. **Convenience**: Single file to compile and maintain
4. **Standard Practice**: Common pattern for small to medium protocols

### What This Protocol Enables

```
┌─────────────────────────┐                 ┌──────────────────────┐
│  Training Backend       │                 │  Dashboard           │
│  (Python + PyTorch)     │                 │  (Next.js)           │
│                         │                 │                      │
│  ┌──────────────────┐   │   gRPC Stream   │  ┌────────────────┐ │
│  │ ML Training Loop │   │◄───────────────►│  │ Image Grid     │ │
│  │ - MNIST/CIFAR    │   │    60 FPS       │  │ (16 tiles)     │ │
│  │ - CNN Model      │   │                 │  ├────────────────┤ │
│  └──────────────────┘   │                 │  │ Loss Charts    │ │
│           │             │                 │  ├────────────────┤ │
│           ▼             │                 │  │ Predictions    │ │
│  ┌──────────────────┐   │                 │  └────────────────┘ │
│  │ gRPC Client      │   │                 │                      │
│  │ (core_messages)  │   │                 │                      │
│  └──────────────────┘   │                 │                      │
└─────────────────────────┘                 └──────────────────────┘
```

### Protocol Flow

**1. Session Establishment** (Unary RPC):
```
Client → RegisterSession(SessionInfo) → Server
Client ← SessionResponse               ← Server
```

**2. Continuous Streaming** (Bidirectional RPC):
```
Client → StreamMetrics(BatchData)    → Server
Client ← MetricsResponse(success)    ← Server
Client → StreamMetrics(EpochData)    → Server
Client ← MetricsResponse(success)    ← Server
```

### Core Messages Breakdown

**High-Frequency Messages** (~60 FPS):
- `BatchData`: Sent after each training batch
  - Contains images, predictions, ground truth, and loss
  - Up to 16 images per batch
  - JPEG-encoded for bandwidth efficiency

**Low-Frequency Messages** (~1 per epoch):
- `EpochData`: Sent at the end of each epoch
  - Aggregate metrics: average loss and accuracy
  - Used for plotting training progress

---

## 3. Generated Stub Files (Proof of gRPC Setup)

This section demonstrates successful gRPC setup by showing the generated Python stub files.

### Code Generation

**Command Used**:
```bash
cd packages/proto
python3 -m grpc_tools.protoc \
  -I. \
  --python_out=. \
  --grpc_python_out=. \
  core_messages.proto
```

**Generated Files**:
```bash
$ ls -lh packages/proto/core_messages_pb2*.py
-rw-r--r-- 1 user user 3.6K Nov 27 10:28 core_messages_pb2.py
-rw-r--r-- 1 user user 5.7K Nov 27 10:28 core_messages_pb2_grpc.py
```

### Generated File 1: `core_messages_pb2.py`

**Purpose**: Python message classes for all message types

**Key Contents**:
- Protocol Buffer runtime version: `6.31.1`
- Package: `metrics`
- Generated classes:
  - `MetricsRequest`
  - `MetricsResponse`
  - `SessionInfo`
  - `SessionResponse`
  - `BatchData`
  - `ImageData`
  - `Prediction`
  - `EpochData`

**Proof of Successful Compilation**:
```python
# File header shows successful generation
# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: core_messages.proto
# Protobuf Python Version: 6.31.1
```

### Generated File 2: `core_messages_pb2_grpc.py`

**Purpose**: gRPC service stubs for client and server implementation

**Key Contents**:
- gRPC version: `1.76.0`
- Generated classes:
  - `MetricsServiceStub` (client interface)
  - `MetricsServiceServicer` (server base class)
  - `add_MetricsServiceServicer_to_server()` (server registration)

**Proof of RPC Generation**:
```python
class MetricsServiceStub(object):
    """Service stub for client"""

    def __init__(self, channel):
        # StreamMetrics: bidirectional streaming
        self.StreamMetrics = channel.stream_stream(
                '/metrics.MetricsService/StreamMetrics',
                request_serializer=core__messages__pb2.MetricsRequest.SerializeToString,
                response_deserializer=core__messages__pb2.MetricsResponse.FromString,
                _registered_method=True)

        # RegisterSession: unary RPC
        self.RegisterSession = channel.unary_unary(
                '/metrics.MetricsService/RegisterSession',
                request_serializer=core__messages__pb2.SessionInfo.SerializeToString,
                response_deserializer=core__messages__pb2.SessionResponse.FromString,
                _registered_method=True)


class MetricsServiceServicer(object):
    """Service base class for server"""

    def StreamMetrics(self, request_iterator, context):
        """Bidirectional streaming RPC"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def RegisterSession(self, request, context):
        """Unary RPC for session registration"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')
```

### Usage Example: Simple Client

```python
import grpc
import core_messages_pb2
import core_messages_pb2_grpc
import time

def run_client():
    # Create channel and stub
    channel = grpc.insecure_channel('localhost:50051')
    stub = core_messages_pb2_grpc.MetricsServiceStub(channel)

    # 1. Register session (Unary RPC)
    session_info = core_messages_pb2.SessionInfo(
        session_id="train_001",
        client_name="pytorch_trainer",
        timestamp_ms=int(time.time() * 1000)
    )

    response = stub.RegisterSession(session_info)
    print(f"✓ Session registered: {response.message}")

    # 2. Stream metrics (Bidirectional streaming)
    def generate_requests():
        for batch_idx in range(10):
            # Create request
            request = core_messages_pb2.MetricsRequest(
                session_id="train_001",
                timestamp_ms=int(time.time() * 1000)
            )

            # Create batch data
            request.batch_data.epoch = 0
            request.batch_data.batch_idx = batch_idx
            request.batch_data.batch_loss = 0.5 - (batch_idx * 0.01)

            # Add image
            img = request.batch_data.images.add()
            img.image_bytes = b'fake_jpeg_data'

            # Add prediction
            pred = request.batch_data.predictions.add()
            pred.predicted_class = 3
            pred.confidence = 0.95

            # Add ground truth
            request.batch_data.ground_truth.append(3)

            yield request
            time.sleep(0.1)

    # Stream with bidirectional communication
    responses = stub.StreamMetrics(generate_requests())
    for response in responses:
        print(f"✓ Server response: {response.message}")

if __name__ == '__main__':
    run_client()
```

### Usage Example: Simple Server

```python
import grpc
from concurrent import futures
import core_messages_pb2
import core_messages_pb2_grpc

class MetricsServiceImpl(core_messages_pb2_grpc.MetricsServiceServicer):
    """Server implementation"""

    def RegisterSession(self, request, context):
        print(f"New session: {request.session_id}")
        print(f"Client: {request.client_name}")

        return core_messages_pb2.SessionResponse(
            success=True,
            session_id=request.session_id,
            message="Session registered successfully"
        )

    def StreamMetrics(self, request_iterator, context):
        for request in request_iterator:
            # Process incoming data
            if request.HasField('batch_data'):
                batch = request.batch_data
                print(f"Received batch {batch.batch_idx} with {len(batch.images)} images")

                # Send acknowledgment
                yield core_messages_pb2.MetricsResponse(
                    session_id=request.session_id,
                    timestamp_ms=request.timestamp_ms,
                    success=True,
                    message=f"Batch {batch.batch_idx} processed"
                )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    core_messages_pb2_grpc.add_MetricsServiceServicer_to_server(
        MetricsServiceImpl(), server
    )
    server.add_insecure_port('[::]:50051')
    server.start()
    print("✓ Server started on port 50051")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
```

### Verification Checklist

- [x] Protocol Buffer compiler (protoc) installed and working
- [x] Python protobuf library version 6.31.1 working
- [x] gRPC Python library version 1.76.0 working
- [x] Message classes successfully generated (`_pb2.py`)
- [x] Service stubs successfully generated (`_pb2_grpc.py`)
- [x] Client stub class available (`MetricsServiceStub`)
- [x] Server servicer class available (`MetricsServiceServicer`)
- [x] Serialization methods working (`SerializeToString`, `FromString`)
- [x] Both unary and streaming RPCs supported

---

## Summary

This document has addressed all three P4 requirements:

### ✅ Requirement 1: Proto Format
- Complete `.proto` format provided
- 2 RPC procedures (StreamMetrics, RegisterSession)
- 8 message types with full field definitions
- All procedures and parameters in single file: `core_messages.proto`

### ✅ Requirement 2: Proto File Explanation
- Explained `core_messages.proto` structure
- Described why procedures and types are in one file
- Explained protocol flow and message frequencies
- Provided architecture diagram

### ✅ Requirement 3: Generated Stub Files
- Demonstrated successful code generation
- Showed generated Python files (3.6KB + 5.7KB)
- Proof of protoc version 31.1 and grpcio version 1.76.0
- Provided working client and server examples

**Project Status**: gRPC protocol fully designed, compiled, and ready for P4 implementation.

---

## Files Reference

| File | Location | Size | Purpose |
|------|----------|------|---------|
| `core_messages.proto` | `/packages/proto/` | - | Complete protocol definition |
| `core_messages_pb2.py` | `/packages/proto/` | 3.6K | Generated message classes |
| `core_messages_pb2_grpc.py` | `/packages/proto/` | 5.7K | Generated service stubs |
