from typing import Iterator
import grpc

from src.proto import metrics_pb2 as pb
from src.proto import metrics_pb2_grpc as pbg


class Client:
    """A gRPC client that subscribes to training metrics from the server."""

    def __init__(self, target: str, timeout: float = 10.0) -> None:
        """Initialize training client."""
        self.channel = grpc.insecure_channel(target)
        self.stub = pbg.TrainingStub(self.channel)
        self.timeout = timeout
        print(f"📡 Client initialized (target={target}, timeout={timeout}s)")

    def status(self) -> pb.StatusRes:
        """Check server status (handshake)."""
        print("🔍 Checking server status...")
        req = pb.StatusReq()

        try:
            res = self.stub.Status(req, timeout=self.timeout)
            print(f"   Status: {res.status}")
            print(f"   Message: {res.message}")
            if res.epoch > 0:
                print(f"   Current epoch: {res.epoch}")
            return res
        except grpc.RpcError as e:
            print(f"❌ Failed to get status: {e.code()} - {e.details()}")
            raise

    def start(self, num_epochs: int, confirmed: bool = True) -> pb.StartRes:
        """Start training on the server."""
        print(f"🎬 Starting training ({num_epochs} epochs, confirmed={confirmed})...")
        req = pb.StartReq(num_epochs=num_epochs, confirmed=confirmed)

        try:
            res = self.stub.Start(req, timeout=self.timeout)
            print(f"   Status: {res.status}")
            print(f"   Message: {res.message}")
            return res
        except grpc.RpcError as e:
            print(f"❌ Failed to start training: {e.code()} - {e.details()}")
            raise

    def subscribe(self) -> Iterator[pb.TrainingMetric]:
        """Subscribe to streaming training metrics from the server."""
        print("📡 Subscribing to metrics stream...")
        req = pb.SubscribeReq()

        try:
            for metric in self.stub.Subscribe(req):
                yield metric
        except grpc.RpcError as e:
            print(f"❌ Streaming error: {e.code()} - {e.details()}")
            raise
        finally:
            print("🔌 Unsubscribed from metrics stream")

    def close(self) -> None:
        """Close the gRPC channel."""
        print("🔌 Closing client channel")
        self.channel.close()
