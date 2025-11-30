from torch.nn import CrossEntropyLoss
from torch.optim import SGD

from src.services.queue_consumer import QueueConsumer
from src.services.metrics_client import MetricsClient
from src.training.data_module import DataModule
from src.training.model import Model
from src.training.trainer import Trainer


def main() -> None:
    """Entry point for training with gRPC metric streaming."""

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

    # 4. Create gRPC client
    client = MetricsClient(target='localhost:50051')

    try:
        # 5. Use QueueConsumer to stream metrics via gRPC while training
        with QueueConsumer(queue=trainer.metrics, handler=client.publish):
            trainer.train(num_epochs=3)
    finally:
        # 6. Cleanup
        client.close()


if __name__ == '__main__':
    main()
