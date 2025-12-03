import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from threading import Thread
from torch.nn import CrossEntropyLoss
from torch.optim import SGD
from grpc import server as Server

# Add generated directory to sys.path for protobuf imports
generated_dir = Path(__file__).parent / "generated"
sys.path.insert(0, str(generated_dir))

from src.generated import metrics_pb2_grpc as pbg
from src.services.servicer import Servicer
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
    def worker(num_epochs: int) -> None:
        """Callback that runs training in a background thread."""
        thread = Thread(target=trainer.train, args=(num_epochs,), daemon=True)
        thread.start()

    # 5. Start gRPC server that streams metrics
    port = 50051
    queue = trainer.metrics
    
    print("🚀 Starting gRPC Training Server...")
    servicer = Servicer(queue, on_start=worker)             # Equivalent of router with set routes
    server = Server(ThreadPoolExecutor(max_workers=10))     # Equivalent of app = express()
    pbg.add_TrainingServicer_to_server(servicer, server)    # Equivalent of app.use(router)
    server.add_insecure_port(f'0.0.0.0:{port}')             # |
    server.start()                                          # Equivalent of app.listen(port, ...)

    print(f"✅ Server listening on port {port}")
    print("📡 Awaiting client connection...\n")

    # 6. Keep server running until interrupted
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        server.stop(grace=2)


if __name__ == '__main__':
    main()
