from pathlib import Path
from typing import Iterator
import sys
import grpc


# Add generated directory to sys.path for protobuf imports
generated_dir = Path(__file__).parent / "generated"
sys.path.insert(0, str(generated_dir))

from src.generated import metrics_pb2 as pb
from src.generated import metrics_pb2_grpc as pbg


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


def main() -> None:
    """Main function to run the client."""

    target: str = 'localhost:50051'
    num_epochs: int = 3
    client = Client(target=target)
    print(f"📡 Connected to training server at {target}.\n")

    try:
        # Step 1: Check server status (handshake)
        res = client.status()

        if res.status == 'ready':
            # Step 2: Ask user for confirmation to start training
            print(f"\n❓ Start training with {num_epochs} epochs?")
            confirmation = input("   Type 'yes' to proceed: ").strip().lower()

            if confirmation != 'yes':
                print("❌ Training cancelled by user.")
                return

            # Step 3: Start training
            print()
            start_res = client.start(num_epochs=num_epochs, confirmed=True)

            if start_res.status != "started":
                print("⚠️  Training not started. Exiting.")
                return

        elif res.status == "training":
            print(f"⚠️  Server is already training at epoch {res.epoch}. Exiting.")

        elif res.status != "ready":
            print("⚠️  Server not ready. Exiting.")
            return

        # Step 4: Subscribe to metrics stream
        print()
        for metric in client.subscribe():
            print(f"📊 Received Metric:")
            print(f"   Epoch: {metric.epoch}")
            print(f"   Batch: {metric.batch}")
            print(f"   Batch Size: {metric.batch_size}")
            print(f"   Batch Loss: {metric.batch_loss:.4f}")
            print(f"   Predictions: {list(metric.preds)[:10]}...")
            print(f"   Truths: {list(metric.truths)[:10]}...")
            print()

    except KeyboardInterrupt:
        print("\n⏹️  Interrupted by user")
        
    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        client.close()


if __name__ == '__main__':
    main()
