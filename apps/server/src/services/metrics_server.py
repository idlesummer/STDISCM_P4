"""gRPC server that streams training metrics to subscribers."""
from concurrent import futures
from queue import Queue, Empty
from typing import Iterator
import grpc

from src.proto import metrics_pb2
from src.proto import metrics_pb2_grpc


class MetricsServicer(metrics_pb2_grpc.MetricsServicer):
    """Implements the Metrics gRPC service with streaming support."""

    def __init__(self, metrics_queue: Queue) -> None:
        """
        Args:
            metrics_queue: Queue that receives metrics from the training loop
        """
        self.metrics_queue = metrics_queue

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


def serve(metrics_queue: Queue, port: int = 50051) -> grpc.Server:
    """
    Start the gRPC server that streams metrics.

    Args:
        metrics_queue: Queue containing training metrics
        port: Port to listen on

    Returns:
        The running gRPC server instance
    """
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    metrics_pb2_grpc.add_MetricsServicer_to_server(
        MetricsServicer(metrics_queue),
        server
    )
    server.add_insecure_port(f'[::]:{port}')
    server.start()

    print(f"🚀 Metrics gRPC Server streaming on port {port}")
    return server
