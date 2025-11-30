from typing import Any, Mapping
import grpc
from src.proto import metrics_pb2 as pb
from src.proto import metrics_pb2_grpc as pbg


class MetricsClient:
    """Thin synchronous gRPC client for publishing batch metrics."""

    def __init__(self, target: str, timeout: float = 2.0) -> None:
        self._channel = grpc.insecure_channel(target)
        self._stub = pbg.MetricsStub(self._channel)
        self._timeout = timeout

    def publish(self, metric: Mapping[str, Any]) -> None:
        req = pb.Metric(
            epoch=int(metric['epoch']),
            batch=int(metric['batch']),
            batch_size=int(metric['batch_size']),
            batch_loss=float(metric['batch_loss']),
            predictions=[int(x) for x in metric['predictions']],
            truths=[int(x) for x in metric['truths']],
        )
        # Best-effort: set deadline; ignore transient failures or log as needed.
        try:
            self._stub.Publish(req, timeout=self._timeout)
        except grpc.RpcError:
            # TODO: add logging / metrics / retry policy if desired
            pass

    def close(self) -> None:
        self._channel.close()
