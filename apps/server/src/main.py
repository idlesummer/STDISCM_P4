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

    # 4. Start gRPC server that streams metrics
    server = serve(metrics_queue=trainer.metrics, port=50051)

    try:
        # 5. Run training (metrics will be streamed via gRPC)
        print("🏋️  Starting training...")
        trainer.train(num_epochs=3)
        print("✅ Training complete!")
    finally:
        # 6. Cleanup
        print("⏹️  Shutting down gRPC server...")
        server.stop(grace=2)


if __name__ == '__main__':
    main()
