from typing import Any, Mapping
import grpc
from src.proto.metrics_pb2_grpc import TrainingStub
from src.proto.metrics_pb2 import TrainingMetric


class Client:
    """A gRPC client that subscribes to training metrics from the server."""

    def __init__(self, target: str, timeout: float = 2.0) -> None:
        """
        Initialize metrics client.

        Args:
            target: gRPC server address (e.g., 'localhost:50051')
            timeout: Request timeout in seconds
        """
        self.channel = grpc.insecure_channel(target)
        self.stub = TrainingStub(self.channel)
        self.timeout = timeout
        print(f"📡 Client initialized (target={target}, timeout={timeout}s)")

    def publish(self, metric: Mapping[str, Any]) -> None:
        """
        Publish a single batch metric to the server.

        Args:
            metric: Dictionary containing epoch, batch, batch_size, batch_loss, preds, truths
        """
        # Equivalent to const req = {...}
        req = TrainingMetric(
            epoch=int(metric['epoch']),
            batch=int(metric['batch']),
            batch_size=int(metric['batch_size']),
            batch_loss=float(metric['batch_loss']),
            preds=[int(x) for x in metric['preds']],
            truths=[int(x) for x in metric['truths']],
        )

        try:
            # Equivalent to axios.post('/Publish', req)
            response = self.stub.Publish(req, timeout=self.timeout)
            print(f"✅ Published metric: epoch={req.epoch}, batch={req.batch}, loss={req.batch_loss:.4f}")
            print(f"   Server response: {response.status}")
        except grpc.RpcError as e:
            print(f"❌ Failed to publish metric: {e.code()} - {e.details()}")
            # Best-effort: log error but don't raise to avoid blocking training



    def close(self) -> None:
        """Close the gRPC channel."""
        print("🔌 Closing Client channel")
        self.channel.close()
