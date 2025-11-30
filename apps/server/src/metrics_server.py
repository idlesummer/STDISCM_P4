"""Simple gRPC server that receives and prints training metrics."""
from concurrent import futures
import grpc

from src.proto import metrics_pb2
from src.proto import metrics_pb2_grpc


class MetricsServicer(metrics_pb2_grpc.MetricsServicer):
    """Implements the Metrics gRPC service."""

    def Publish(self, request: metrics_pb2.Metric, context) -> metrics_pb2.PublishReply:
        """Receive and print training metrics."""
        print(f"\n📊 Received Metric:")
        print(f"   Epoch: {request.epoch}")
        print(f"   Batch: {request.batch}")
        print(f"   Batch Size: {request.batch_size}")
        print(f"   Batch Loss: {request.batch_loss:.4f}")
        print(f"   Predictions: {list(request.predictions)[:10]}...")  # Show first 10
        print(f"   Truths: {list(request.truths)[:10]}...")

        return metrics_pb2.PublishReply(status="ok")


def serve(port: int = 50051) -> None:
    """Start the gRPC server."""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    metrics_pb2_grpc.add_MetricsServicer_to_server(MetricsServicer(), server)
    server.add_insecure_port(f'[::]:{port}')
    server.start()

    print(f"🚀 Metrics gRPC Server listening on port {port}")
    print("Waiting for metrics...")

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        print("\n⏹️  Shutting down server...")
        server.stop(0)


if __name__ == '__main__':
    serve()
