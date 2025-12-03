"""Simple client that subscribes to metrics stream and prints them."""
from src.services.client import Client


def subscribe_to_metrics(target: str = 'localhost:50051', num_epochs: int = 3) -> None:
    """Subscribe to the metrics stream and print incoming metrics."""
    print(f"📡 Connecting to training server at {target}...\n")

    client = Client(target=target)

    try:
        # Step 1: Check server status (handshake)
        status = client.status()

        if status.status == "training":
            print(f"⚠️  Server is already training at epoch {status.epoch}. Exiting.")
            return

        if status.status != "ready":
            print("⚠️  Server not ready. Exiting.")
            return

        # Step 2: Ask user for confirmation
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
    subscribe_to_metrics()
