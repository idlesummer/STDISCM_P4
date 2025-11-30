"""Simple client that subscribes to metrics stream and prints them."""
import grpc

from src.proto import metrics_pb2
from src.proto import metrics_pb2_grpc


def subscribe_to_metrics(target: str = 'localhost:50051', num_epochs: int = 3) -> None:
    """
    Subscribe to the metrics stream and print incoming metrics.

    Args:
        target: gRPC server address
        num_epochs: Number of epochs to train
    """
    print(f"📡 Connecting to metrics server at {target}...")

    with grpc.insecure_channel(target) as channel:
        stub = metrics_pb2_grpc.MetricsStub(channel)

        print("✅ Connected!")

        try:
            # Step 1: Check server status (handshake)
            print("\n🔍 Checking server status...")
            status_request = metrics_pb2.GetStatusRequest()
            status_reply = stub.GetStatus(status_request)
            print(f"   Status: {status_reply.status}")
            print(f"   Message: {status_reply.message}")

            if status_reply.status == "training":
                print(f"   Currently at epoch: {status_reply.current_epoch}")
                print("⚠️  Server is already training. Exiting.")
                return

            if status_reply.status != "ready":
                print("⚠️  Server not ready. Exiting.")
                return

            # Step 2: Ask user for confirmation
            print(f"\n❓ Start training with {num_epochs} epochs?")
            confirmation = input("   Type 'yes' to proceed: ").strip().lower()

            if confirmation != 'yes':
                print("❌ Training cancelled by user.")
                return

            # Step 3: Start training with confirmation (stateless - all in one call)
            print(f"\n✅ Starting training ({num_epochs} epochs)...")
            start_request = metrics_pb2.StartTrainingRequest(
                num_epochs=num_epochs,
                confirmed=True
            )
            start_reply = stub.StartTraining(start_request)
            print(f"   Status: {start_reply.status}")
            print(f"   Message: {start_reply.message}")

            if start_reply.status != "started":
                print("⚠️  Training not started. Exiting.")
                return

            print("\n📡 Subscribing to metrics stream...\n")

            # Step 4: Subscribe to the metrics stream
            subscribe_request = metrics_pb2.SubscribeRequest()
            for metric in stub.Subscribe(subscribe_request):
                print(f"📊 Received Metric:")
                print(f"   Epoch: {metric.epoch}")
                print(f"   Batch: {metric.batch}")
                print(f"   Batch Size: {metric.batch_size}")
                print(f"   Batch Loss: {metric.batch_loss:.4f}")
                print(f"   Predictions: {list(metric.predictions)[:10]}...")
                print(f"   Truths: {list(metric.truths)[:10]}...")
                print()

        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.UNAVAILABLE:
                print("❌ Server unavailable. Make sure the training server is running.")
            else:
                print(f"❌ Error: {e}")
        except KeyboardInterrupt:
            print("\n⏹️  Unsubscribed from metrics stream")


if __name__ == '__main__':
    subscribe_to_metrics()
