from torch.nn import CrossEntropyLoss
from torch.optim import SGD

from src.services.queue_consumer import QueueConsumer
from src.training.data_module import DataModule
from src.training.model import Model
from src.training.trainer import Trainer


def stream_metrics(metric: dict) -> None:
    """Process or stream each metric (e.g., send to API)."""
    print(metric)  # replace with API call, WebSocket push, etc.


def main() -> None:
    """Entry point for training with background metric streaming."""

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

    # 4. Use QueueConsumer to stream metrics while training
    with QueueConsumer(queue=trainer.metrics, handler=stream_metrics):
        trainer.train(num_epochs=3)


if __name__ == '__main__':
    main()
