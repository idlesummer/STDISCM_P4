# gRPC Message Types Reference

This document outlines the key message types used in the training metrics monitoring system.

## Core Data Messages

### BatchData
Per-batch metrics sent during training.

**Fields:**
- `uint32 epoch` - Current epoch number
- `uint32 batch_idx` - Batch index within the epoch
- `uint32 batch_size` - Actual number of images in this batch
- `repeated ImageData images` - Image data for visualization (up to 16 images)
- `repeated Prediction predictions` - Model predictions for each image
- `repeated int32 ground_truth` - Ground truth class indices
- `float batch_loss` - Loss value for this batch
- `float batch_accuracy` - Accuracy for this batch (optional)
- `uint64 timestamp_ms` - Unix timestamp in milliseconds

**Usage:** Sent for each training batch to provide detailed metrics, visualizations, and predictions.

---

### ImageData
Individual image data for visualization.

**Fields:**
- `bytes image_bytes` - Encoded image data (JPEG/PNG)
- `string format` - Image format ("jpeg", "png", etc.)
- `uint32 width` - Image width in pixels
- `uint32 height` - Image height in pixels
- `uint32 channels` - Number of channels (1 for grayscale, 3 for RGB)
- `string image_id` - Optional identifier or filename

**Usage:** Embedded within `BatchData` to send images for real-time visualization in the monitoring dashboard.

---

### Prediction
Model prediction with confidence scores.

**Fields:**
- `int32 predicted_class` - Predicted class index
- `string predicted_label` - Human-readable label (e.g., "cat", "dog")
- `float confidence` - Confidence score (0.0 - 1.0)
- `repeated ClassScore top_k_scores` - Optional top-k predictions

**Usage:** Provides detailed prediction information for each image in a batch, enabling per-sample analysis and debugging.

---

## Performance Monitoring

### PerformanceData
Performance and timing metrics.

**Fields:**
- `float time_per_batch_ms` - Average time per batch in milliseconds
- `float total_time_for_epoch_sec` - Total time for current epoch in seconds
- `float estimated_time_remaining_sec` - Estimated time remaining
- `float current_fps` - **Current frames per second (REQUIRED)**
- `float average_fps` - **Average FPS over recent window (REQUIRED)**
- `optional ResourceUsage resource_usage` - CPU/GPU utilization
- `uint64 timestamp_ms` - Unix timestamp in milliseconds

**Usage:** Tracks training performance and throughput. FPS metrics are critical for monitoring training efficiency.

---

## Status Management

### StatusUpdate
Training status updates.

**Fields:**
- `TrainingStatus status` - Current training state (enum)
- `string message` - Optional status message
- `optional TrainingConfig config` - Training configuration
- `uint64 timestamp_ms` - Unix timestamp in milliseconds

**TrainingStatus Enum:**
- `UNKNOWN = 0`
- `INITIALIZING = 1`
- `RUNNING = 2`
- `PAUSED = 3`
- `COMPLETED = 4`
- `FAILED = 5`

**Usage:** Communicates training state changes to the monitoring backend.

---

## Session Management

### SessionInfo
Initial handshake request from training app.

**Fields:**
- `string session_id` - Unique session identifier
- `string client_name` - Client identifier (e.g., "pytorch_trainer")
- `string client_version` - Client version string
- `TrainingConfig config` - Training configuration details
- `uint64 timestamp_ms` - Unix timestamp in milliseconds

**Usage:** Sent during initial connection to register the training session with the monitoring backend.

---

### SessionResponse
Handshake response from monitoring backend.

**Fields:**
- `bool success` - Whether registration succeeded
- `string session_id` - Confirmed session identifier
- `string message` - Response message
- `ServerConfig server_config` - Server configuration and limits

**Usage:** Confirms session registration and provides server capabilities/constraints to the training app.

---

## Request/Response Wrappers

### MetricsRequest
Main request wrapper (Training App → Backend).

**Fields:**
- `string session_id` - Session identifier
- `uint64 timestamp_ms` - Unix timestamp
- `oneof payload` - One of:
  - `BatchData batch_data`
  - `EpochData epoch_data`
  - `PerformanceData performance_data`
  - `StatusUpdate status_update`
  - `Heartbeat heartbeat`

---

### MetricsResponse
Main response wrapper (Backend → Training App).

**Fields:**
- `string session_id` - Session identifier
- `uint64 timestamp_ms` - Unix timestamp
- `oneof payload` - One of:
  - `Acknowledgment ack`
  - `ControlCommand command`
  - `ErrorResponse error`

---

## Data Flow

```
Training App                          Monitoring Backend
     |                                        |
     |  RegisterTrainingSession               |
     |  (SessionInfo)                         |
     |--------------------------------------->|
     |                                        |
     |            SessionResponse             |
     |<---------------------------------------|
     |                                        |
     |  StreamMetrics (bidirectional)         |
     |<======================================>|
     |                                        |
     |  MetricsRequest(BatchData)             |
     |--------------------------------------->|
     |                                        |
     |  MetricsRequest(PerformanceData)       |
     |--------------------------------------->|
     |                                        |
     |            MetricsResponse(Ack)        |
     |<---------------------------------------|
     |                                        |
     |  MetricsRequest(StatusUpdate)          |
     |--------------------------------------->|
     |                                        |
```

## Key Design Decisions

1. **Separate message types** enable flexibility - send only what's needed when it's needed
2. **BatchData includes images** for real-time visualization without additional requests
3. **Prediction detail** allows per-sample analysis and confidence visualization
4. **FPS metrics** in PerformanceData meet project requirements for throughput monitoring
5. **StatusUpdate** provides clear training lifecycle management
6. **Session handshake** establishes connection and negotiates capabilities
