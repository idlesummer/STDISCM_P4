from threading import Thread
from torch.nn import CrossEntropyLoss
from torch.optim import SGD

from src.services.metrics_server import serve
from src.training.data_module import DataModule
from src.training.model import Model
from src.training.trainer import Trainer


def main() -> None:
    """Entry point for training with gRPC metric streaming server."""

    # 1. Load data
    data = DataModule(root='./data', batch_size=16, download=True)
    train_loader, _ = data.get_loaders()

    # 2. Build model + optimizer + loss
    model = Model()
    criterion = CrossEntropyLoss()
    optimizer = SGD(model.parameters(), lr=0.01)

    # 3. Create trainer (producer of metrics)
    trainer = Trainer(
        model=model,
        criterion=criterion,
        optimizer=optimizer,
        dataloader=train_loader,
        tolerance=0.001,
        update_interval=160,
    )

    # 4. Define training callback
    def start_training(num_epochs: int) -> None:
        """Callback that runs training in a background thread."""
        def run():
            print(f"🏋️  Starting training for {num_epochs} epochs...")
            trainer.train(num_epochs=num_epochs)
            print("✅ Training complete!")

        Thread(target=run, daemon=False).start()

    # 5. Start gRPC server that streams metrics
    server = serve(
        metrics_queue=trainer.metrics,
        on_training_start=start_training,
        port=50051
    )

    try:
        # 6. Keep server running until interrupted
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\n⏹️  Shutting down gRPC server...")
        server.stop(grace=2)


if __name__ == '__main__':
    main()
