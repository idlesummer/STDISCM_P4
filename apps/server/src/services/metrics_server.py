"""gRPC server that streams training metrics to subscribers."""
from concurrent import futures
from queue import Queue, Empty
from threading import Event
from typing import Iterator, Callable
import grpc

from src.proto import metrics_pb2
from src.proto import metrics_pb2_grpc


class MetricsServicer(metrics_pb2_grpc.MetricsServicer):
    """Implements the Metrics gRPC service with streaming support."""

    def __init__(
        self,
        metrics_queue: Queue,
        on_training_start: Callable[[int], None]
    ) -> None:
        """
        Args:
            metrics_queue: Queue that receives metrics from the training loop
            on_training_start: Callback to trigger training start with num_epochs
        """
        self.metrics_queue = metrics_queue
        self.on_training_start = on_training_start
        self.training_started = False
        self.pending_num_epochs = None  # Stores num_epochs awaiting confirmation

    def StartTraining(
        self,
        request: metrics_pb2.StartTrainingRequest,
        context
    ) -> metrics_pb2.StartTrainingReply:
        """Client requests to prepare training (step 1 of 2)."""
        if self.training_started:
            print("⚠️  Training already running")
            return metrics_pb2.StartTrainingReply(
                status="already_running",
                message="Training is already in progress"
            )

        if self.pending_num_epochs is not None:
            print("⚠️  Training already prepared, awaiting confirmation")
            return metrics_pb2.StartTrainingReply(
                status="already_ready",
                message=f"Training ready with {self.pending_num_epochs} epochs. Send confirmation to start."
            )

        num_epochs = request.num_epochs if request.num_epochs > 0 else 3
        self.pending_num_epochs = num_epochs
        print(f"📋 Training prepared: {num_epochs} epochs")
        print("⏸️  Waiting for client confirmation...")

        return metrics_pb2.StartTrainingReply(
            status="ready",
            message=f"Ready to train for {num_epochs} epochs. Send confirmation to proceed."
        )

    def ConfirmTraining(
        self,
        request: metrics_pb2.ConfirmTrainingRequest,
        context
    ) -> metrics_pb2.ConfirmTrainingReply:
        """Client confirms to actually start training (step 2 of 2)."""
        if self.training_started:
            print("⚠️  Training already running")
            return metrics_pb2.ConfirmTrainingReply(status="already_running")

        if self.pending_num_epochs is None:
            print("⚠️  No training prepared. Call StartTraining first.")
            return metrics_pb2.ConfirmTrainingReply(status="not_ready")

        if not request.confirmed:
            print("❌ Client cancelled training")
            self.pending_num_epochs = None
            return metrics_pb2.ConfirmTrainingReply(status="cancelled")

        # Start training
        num_epochs = self.pending_num_epochs
        self.pending_num_epochs = None
        self.training_started = True

        print(f"✅ Client confirmed! Starting training: {num_epochs} epochs")
        self.on_training_start(num_epochs)

        return metrics_pb2.ConfirmTrainingReply(status="started")

    def Subscribe(
        self,
        request: metrics_pb2.SubscribeRequest,
        context
    ) -> Iterator[metrics_pb2.Metric]:
        """Stream metrics to subscribers as they arrive."""
        print("📡 Client subscribed to metrics stream")

        try:
            while True:
                # Block until a metric is available (with timeout to check for cancellation)
                try:
                    metric_dict = self.metrics_queue.get(timeout=1.0)

                    # Convert dict to protobuf message
                    metric = metrics_pb2.Metric(
                        epoch=int(metric_dict['epoch']),
                        batch=int(metric_dict['batch']),
                        batch_size=int(metric_dict['batch_size']),
                        batch_loss=float(metric_dict['batch_loss']),
                        predictions=[int(x) for x in metric_dict['predictions']],
                        truths=[int(x) for x in metric_dict['truths']],
                    )

                    yield metric

                except Empty:
                    # Check if client disconnected
                    if context.is_active():
                        continue
                    else:
                        break

        except Exception as e:
            print(f"❌ Streaming error: {e}")
        finally:
            print("🔌 Client unsubscribed from metrics stream")


def serve(
    metrics_queue: Queue,
    on_training_start: Callable[[int], None],
    port: int = 50051
) -> grpc.Server:
    """
    Start the gRPC server that streams metrics.

    Args:
        metrics_queue: Queue containing training metrics
        on_training_start: Callback to trigger training start
        port: Port to listen on

    Returns:
        The running gRPC server instance
    """
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    metrics_pb2_grpc.add_MetricsServicer_to_server(
        MetricsServicer(metrics_queue, on_training_start),
        server
    )
    server.add_insecure_port(f'[::]:{port}')
    server.start()

    print(f"🚀 Metrics gRPC Server listening on port {port}")
    print("⏸️  Waiting for client to start training...")
    return server
