# Code Generation from Protocol Buffers

## Prerequisites

### Python
```bash
pip install grpcio grpcio-tools
```

### TypeScript/JavaScript
```bash
npm install -g @grpc/grpc-js @grpc/proto-loader
# or for static code generation:
npm install -g grpc-tools grpc_tools_node_protoc_ts
```

## Generate Python Code

```bash
# From the packages/proto directory
python -m grpc_tools.protoc \
  -I. \
  --python_out=../../apps/monitoring/generated \
  --grpc_python_out=../../apps/monitoring/generated \
  --pyi_out=../../apps/monitoring/generated \
  telemetry.proto
```

This generates:
- `telemetry_pb2.py` - Message classes
- `telemetry_pb2_grpc.py` - Service stubs
- `telemetry_pb2.pyi` - Type hints

## Generate TypeScript Code (for Dashboard)

### Option 1: Dynamic Loading (Simpler)
```typescript
// No code generation needed!
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync(
  'telemetry.proto',
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const telemetryProto = grpc.loadPackageDefinition(packageDefinition).telemetry;
```

### Option 2: Static Code Generation (Type-safe)
```bash
# Generate TypeScript definitions
grpc_tools_node_protoc \
  --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
  --ts_out=grpc_js:../../apps/dashboard/src/generated \
  --js_out=import_style=commonjs:../../apps/dashboard/src/generated \
  --grpc_out=grpc_js:../../apps/dashboard/src/generated \
  -I. \
  telemetry.proto
```

## Usage Examples

### Python Server (Monitoring Backend)

```python
# monitoring/server.py
import grpc
from concurrent import futures
from generated import telemetry_pb2, telemetry_pb2_grpc
import asyncio

class TelemetryServicer(telemetry_pb2_grpc.TelemetryServiceServicer):
    def StreamTelemetry(self, request_iterator, context):
        """Bidirectional streaming RPC"""

        for request in request_iterator:
            # Handle incoming telemetry
            if request.HasField('batch_data'):
                batch = request.batch_data
                print(f"Received batch {batch.batch_idx} from epoch {batch.epoch}")

                # Process images
                for img in batch.images:
                    print(f"  Image: {img.width}x{img.height}, {len(img.image_bytes)} bytes")

                # Forward to dashboard via WebSocket
                await broadcast_to_dashboard(request)

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
                # Log heartbeat
                print(f"Heartbeat: {request.heartbeat.sequence_number}")

            elif request.HasField('status_update'):
                status = request.status_update
                print(f"Training status: {status.status}")

    def RegisterTrainingSession(self, request, context):
        """Unary RPC for session registration"""
        print(f"New session: {request.session_id}")

        return telemetry_pb2.SessionResponse(
            success=True,
            session_id=request.session_id,
            message="Session registered successfully",
            server_config=telemetry_pb2.ServerConfig(
                max_batch_size=16,
                max_image_dimension=512,
                heartbeat_interval_ms=2000,
                buffer_size=100
            )
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    telemetry_pb2_grpc.add_TelemetryServiceServicer_to_server(
        TelemetryServicer(), server
    )
    server.add_insecure_port('[::]:50051')
    server.start()
    print("gRPC server started on port 50051")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
```

### Python Client (Training App)

```python
# training/telemetry_client.py
import grpc
from generated import telemetry_pb2, telemetry_pb2_grpc
import time
import cv2
import numpy as np

class TelemetryClient:
    def __init__(self, server_address='localhost:50051'):
        self.channel = grpc.insecure_channel(server_address)
        self.stub = telemetry_pb2_grpc.TelemetryServiceStub(self.channel)
        self.session_id = f"session_{int(time.time())}"

    def register_session(self, config):
        """Register training session"""
        response = self.stub.RegisterTrainingSession(
            telemetry_pb2.SessionInfo(
                session_id=self.session_id,
                client_name="pytorch_trainer",
                client_version="1.0.0",
                config=config,
                timestamp_ms=int(time.time() * 1000)
            )
        )
        print(f"Session registered: {response.message}")
        return response.server_config

    def send_batch_data(self, epoch, batch_idx, images, predictions, ground_truth, loss):
        """Send batch telemetry"""

        # Prepare image data
        image_data_list = []
        for img_np in images[:16]:  # Max 16 images
            # Resize if needed
            if img_np.shape[0] > 256:
                img_np = cv2.resize(img_np, (256, 256))

            # JPEG encode
            _, buffer = cv2.imencode('.jpg', img_np, [cv2.IMWRITE_JPEG_QUALITY, 85])

            image_data_list.append(
                telemetry_pb2.ImageData(
                    image_bytes=buffer.tobytes(),
                    format="jpeg",
                    width=img_np.shape[1],
                    height=img_np.shape[0],
                    channels=img_np.shape[2] if len(img_np.shape) > 2 else 1
                )
            )

        # Prepare predictions
        prediction_list = []
        for pred_idx, pred_score in zip(predictions['classes'], predictions['scores']):
            prediction_list.append(
                telemetry_pb2.Prediction(
                    predicted_class=int(pred_idx),
                    predicted_label=predictions['labels'][pred_idx],
                    confidence=float(pred_score)
                )
            )

        # Create batch data message
        return telemetry_pb2.TelemetryRequest(
            session_id=self.session_id,
            timestamp_ms=int(time.time() * 1000),
            batch_data=telemetry_pb2.BatchData(
                epoch=epoch,
                batch_idx=batch_idx,
                batch_size=len(images),
                images=image_data_list,
                predictions=prediction_list,
                ground_truth=ground_truth,
                batch_loss=loss,
                timestamp_ms=int(time.time() * 1000)
            )
        )

    def stream_telemetry(self, request_generator):
        """Bidirectional streaming"""
        try:
            for response in self.stub.StreamTelemetry(request_generator):
                if response.HasField('ack'):
                    print(f"Batch {response.ack.batch_idx} acknowledged")
                elif response.HasField('command'):
                    print(f"Received command: {response.command.type}")
                    # Handle command (pause, stop, etc.)
                elif response.HasField('error'):
                    print(f"Error: {response.error.message}")
        except grpc.RpcError as e:
            print(f"gRPC error: {e.code()}, {e.details()}")
            # Implement reconnection logic

# Usage in training loop
client = TelemetryClient()

# Register session
config = telemetry_pb2.TrainingConfig(
    total_epochs=10,
    batches_per_epoch=100,
    batch_size=16,
    model_name="ResNet18",
    dataset_name="CIFAR-10",
    class_names=["cat", "dog", "bird", ...]
)
server_config = client.register_session(config)

# Training loop
def telemetry_generator():
    for epoch in range(10):
        for batch_idx, (images, labels) in enumerate(dataloader):
            # Train
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            # Send telemetry
            yield client.send_batch_data(
                epoch=epoch,
                batch_idx=batch_idx,
                images=images.cpu().numpy(),
                predictions=get_predictions(outputs),
                ground_truth=labels.cpu().numpy().tolist(),
                loss=loss.item()
            )

# Start streaming
client.stream_telemetry(telemetry_generator())
```

### TypeScript/Next.js (Dashboard)

```typescript
// dashboard/src/lib/telemetry-client.ts
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = '../../../packages/proto/telemetry.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const telemetryProto = grpc.loadPackageDefinition(packageDefinition).telemetry as any;

export class TelemetryClient {
  private client: any;
  private stream: any;

  constructor(serverAddress: string = 'localhost:50051') {
    this.client = new telemetryProto.TelemetryService(
      serverAddress,
      grpc.credentials.createInsecure()
    );
  }

  connectStream(onBatchData: (data: any) => void) {
    this.stream = this.client.StreamTelemetry();

    this.stream.on('data', (response: any) => {
      if (response.batch_data) {
        // Convert image bytes to base64 for display
        const images = response.batch_data.images.map((img: any) => ({
          src: `data:image/${img.format};base64,${img.image_bytes.toString('base64')}`,
          width: img.width,
          height: img.height
        }));

        onBatchData({
          epoch: response.batch_data.epoch,
          batchIdx: response.batch_data.batch_idx,
          images,
          predictions: response.batch_data.predictions,
          groundTruth: response.batch_data.ground_truth,
          loss: response.batch_data.batch_loss
        });
      }
    });

    this.stream.on('error', (error: Error) => {
      console.error('Stream error:', error);
      // Implement reconnection
      setTimeout(() => this.connectStream(onBatchData), 2000);
    });

    this.stream.on('end', () => {
      console.log('Stream ended');
    });
  }

  sendCommand(commandType: string) {
    const request = {
      session_id: 'dashboard',
      timestamp_ms: Date.now(),
      command: {
        type: commandType
      }
    };
    this.stream.write(request);
  }

  close() {
    if (this.stream) {
      this.stream.end();
    }
  }
}
```

## Troubleshooting

### Import errors in Python
```bash
# Make sure generated files are in Python path
export PYTHONPATH="${PYTHONPATH}:/path/to/generated"

# Or add __init__.py in generated directory
touch apps/monitoring/generated/__init__.py
```

### gRPC connection refused
```bash
# Check if server is running
lsof -i :50051

# Check firewall
sudo ufw allow 50051
```

### Type errors in TypeScript
```bash
# Install type definitions
npm install --save-dev @types/node @types/google-protobuf
```

## Next Steps

1. Generate code for both Python and TypeScript
2. Implement server-side servicer
3. Implement client-side streaming
4. Test bidirectional communication
5. Add error handling and reconnection logic
