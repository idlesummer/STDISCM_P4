# Core Data Messages - Complete Reference

This document provides complete definitions and documentation for the 4 simplified core data messages used in the ML training monitoring system.

---

## 1. BatchData

**Purpose:** High-frequency message (~60 FPS) sent after each training batch.

### Complete Definition

```protobuf
message BatchData {
  uint32 epoch = 1;
  uint32 batch_idx = 2;
  repeated ImageData images = 3;           // Up to 16 images
  repeated Prediction predictions = 4;
  repeated int32 ground_truth = 5;         // Class indices
  float batch_loss = 6;
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `epoch` | `uint32` | Current training epoch number (0-indexed or 1-indexed) |
| `batch_idx` | `uint32` | Batch index within the current epoch |
| `images` | `repeated ImageData` | Up to 16 JPEG-encoded images from this batch |
| `predictions` | `repeated Prediction` | Model predictions for each image (length matches images) |
| `ground_truth` | `repeated int32` | True class indices for each image (length matches images) |
| `batch_loss` | `float` | Loss value computed for this batch |

### Usage Example (Python)

```python
import metrics_pb2

# Create BatchData message
batch_data = metrics_pb2.BatchData(
    epoch=5,
    batch_idx=142,
    batch_loss=0.234
)

# Add images (up to 16)
for img_tensor, pred, true_label in zip(images, predictions, labels):
    # Encode image as JPEG
    img_bytes = encode_jpeg(img_tensor)

    # Add image
    image_data = batch_data.images.add()
    image_data.image_bytes = img_bytes

    # Add prediction
    prediction = batch_data.predictions.add()
    prediction.predicted_class = pred.argmax()
    prediction.confidence = pred.max()

    # Add ground truth
    batch_data.ground_truth.append(true_label)
```

### Size Estimate

- **Metadata**: ~20 bytes (epoch, batch_idx, loss)
- **16 JPEG images** (256×256, 85% quality): ~30 KB each = **480 KB**
- **16 predictions**: ~8 bytes each = 128 bytes
- **16 ground truth**: ~4 bytes each = 64 bytes
- **Total per batch**: ~**480 KB**

At 60 FPS: **28.8 MB/s bandwidth**

---

## 2. ImageData

**Purpose:** Container for a single JPEG-encoded image.

### Complete Definition

```protobuf
message ImageData {
  bytes image_bytes = 1;  // JPEG-encoded image data
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `image_bytes` | `bytes` | Raw JPEG-encoded image data (no additional metadata) |

### Design Decisions

- **JPEG-only**: All images are JPEG-encoded for bandwidth efficiency
- **No metadata**: Width, height, channels are assumed consistent (256×256×3 RGB)
- **No identifiers**: Image position in the array is sufficient for tracking

### Usage Example (Python)

```python
import cv2
import metrics_pb2

def create_image_data(img_tensor):
    """Convert image tensor to ImageData message."""
    # img_tensor shape: (C, H, W) or (H, W, C)
    img_np = tensor_to_numpy(img_tensor)  # Convert to (H, W, C)

    # Encode as JPEG (85% quality for good compression)
    success, encoded = cv2.imencode('.jpg', img_np, [cv2.IMWRITE_JPEG_QUALITY, 85])

    # Create message
    image_data = metrics_pb2.ImageData()
    image_data.image_bytes = encoded.tobytes()

    return image_data
```

### Usage Example (TypeScript/Dashboard)

```typescript
function displayImage(imageData: ImageData, canvas: HTMLCanvasElement) {
  // Create blob from bytes
  const blob = new Blob([imageData.getImageBytes()], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);

  // Load and display
  const img = new Image();
  img.onload = () => {
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
```

---

## 3. Prediction

**Purpose:** Model prediction with confidence score for a single image.

### Complete Definition

```protobuf
message Prediction {
  int32 predicted_class = 1;  // Predicted class index
  float confidence = 2;       // Confidence score (0.0 - 1.0)
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `predicted_class` | `int32` | Zero-indexed class ID predicted by the model |
| `confidence` | `float` | Confidence/probability score between 0.0 and 1.0 |

### Design Decisions

- **No label string**: Class labels derived from `TrainingConfig.class_names[predicted_class]`
- **No top-k**: Only the top prediction is sent (simplifies protocol)
- **Confidence is mandatory**: Always include confidence for visualization

### Usage Example (Python)

```python
import torch
import metrics_pb2

def create_prediction(model_output):
    """Convert model output to Prediction message."""
    # model_output shape: (num_classes,)
    probabilities = torch.softmax(model_output, dim=0)

    predicted_class = probabilities.argmax().item()
    confidence = probabilities.max().item()

    prediction = metrics_pb2.Prediction()
    prediction.predicted_class = predicted_class
    prediction.confidence = confidence

    return prediction
```

### Usage Example (TypeScript/Dashboard)

```typescript
interface PredictionDisplay {
  className: string;
  confidence: number;
  isCorrect: boolean;
}

function formatPrediction(
  pred: Prediction,
  groundTruth: number,
  classNames: string[]
): PredictionDisplay {
  return {
    className: classNames[pred.getPredictedClass()],
    confidence: pred.getConfidence(),
    isCorrect: pred.getPredictedClass() === groundTruth
  };
}
```

---

## 4. EpochData

**Purpose:** Low-frequency message sent at the end of each epoch.

### Complete Definition

```protobuf
message EpochData {
  uint32 epoch = 1;
  float average_loss = 2;
  float average_accuracy = 3;
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `epoch` | `uint32` | Completed epoch number |
| `average_loss` | `float` | Average loss across all batches in this epoch |
| `average_accuracy` | `float` | Average accuracy across all batches (0.0 - 1.0) |

### Design Decisions

- **Minimal fields**: Only essential aggregate metrics
- **No validation metrics**: Can be added later if needed
- **No learning rate**: Tracked separately if needed

### Usage Example (Python)

```python
import metrics_pb2

class EpochTracker:
    def __init__(self):
        self.losses = []
        self.accuracies = []

    def add_batch(self, loss, accuracy):
        self.losses.append(loss)
        self.accuracies.append(accuracy)

    def create_epoch_data(self, epoch):
        """Create EpochData message at epoch completion."""
        epoch_data = metrics_pb2.EpochData()
        epoch_data.epoch = epoch
        epoch_data.average_loss = sum(self.losses) / len(self.losses)
        epoch_data.average_accuracy = sum(self.accuracies) / len(self.accuracies)

        # Reset for next epoch
        self.losses.clear()
        self.accuracies.clear()

        return epoch_data
```

---

## Sending Messages

All core data messages are wrapped in `MetricsRequest` before sending:

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
```

### Example: Sending BatchData

```python
import time
import metrics_pb2

def send_batch_data(stream, session_id, batch_data):
    """Send BatchData wrapped in MetricsRequest."""
    request = metrics_pb2.MetricsRequest()
    request.session_id = session_id
    request.timestamp_ms = int(time.time() * 1000)
    request.batch_data.CopyFrom(batch_data)

    stream.write(request)
```

### Example: Sending EpochData

```python
def send_epoch_data(stream, session_id, epoch_data):
    """Send EpochData wrapped in MetricsRequest."""
    request = metrics_pb2.MetricsRequest()
    request.session_id = session_id
    request.timestamp_ms = int(time.time() * 1000)
    request.epoch_data.CopyFrom(epoch_data)

    stream.write(request)
```

---

## Complete Training Loop Example

```python
import metrics_pb2
import metrics_pb2_grpc

class TrainingMonitor:
    def __init__(self, session_id, stream):
        self.session_id = session_id
        self.stream = stream
        self.epoch_tracker = EpochTracker()

    def train(self, model, dataloader, num_epochs):
        for epoch in range(num_epochs):
            for batch_idx, (images, labels) in enumerate(dataloader):
                # Forward pass
                outputs = model(images)
                loss = criterion(outputs, labels)

                # Backward pass
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                # Calculate accuracy
                predictions = outputs.argmax(dim=1)
                accuracy = (predictions == labels).float().mean()

                # Track for epoch summary
                self.epoch_tracker.add_batch(loss.item(), accuracy.item())

                # Create BatchData (send first 16 images)
                batch_data = metrics_pb2.BatchData()
                batch_data.epoch = epoch
                batch_data.batch_idx = batch_idx
                batch_data.batch_loss = loss.item()

                for i in range(min(16, len(images))):
                    # Add image
                    img_data = create_image_data(images[i])
                    batch_data.images.append(img_data)

                    # Add prediction
                    pred = create_prediction(outputs[i])
                    batch_data.predictions.append(pred)

                    # Add ground truth
                    batch_data.ground_truth.append(labels[i].item())

                # Send batch data
                send_batch_data(self.stream, self.session_id, batch_data)

            # End of epoch - send epoch summary
            epoch_data = self.epoch_tracker.create_epoch_data(epoch)
            send_epoch_data(self.stream, self.session_id, epoch_data)
```

---

## Bandwidth Calculations

### Per-Batch (60 FPS)

| Component | Size | Notes |
|-----------|------|-------|
| BatchData metadata | 20 B | epoch, batch_idx, loss |
| 16 × ImageData | 480 KB | 30 KB per JPEG image |
| 16 × Prediction | 128 B | 8 bytes per prediction |
| 16 × ground_truth | 64 B | 4 bytes per int32 |
| **Total** | **~480 KB** | Per batch |

**At 60 FPS**: 480 KB × 60 = **28.8 MB/s**

### Per-Epoch (Low Frequency)

| Component | Size |
|-----------|------|
| EpochData | ~20 B |

Sent once per epoch (negligible bandwidth).

---

## Key Simplifications

1. **BatchData**: Removed `batch_size`, `batch_accuracy`, `timestamp_ms`
2. **ImageData**: Removed format, dimensions, channels, ID (JPEG-only)
3. **Prediction**: Removed label string, top-k scores (derive labels from config)
4. **EpochData**: Removed validation metrics, learning rate, convergence flag

**Result**: ~40% reduction in message size and complexity while maintaining all core functionality.

---

## Files

- Protocol Definition: `/packages/proto/metrics.proto`
- Message Types Overview: `/packages/proto/MESSAGE_TYPES.md`
- This Document: `/packages/proto/CORE_DATA_MESSAGES.md`
