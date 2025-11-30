from typing import Any, Mapping
import grpc
from src.proto.metrics_pb2_grpc import TrainingStub
from src.proto.metrics_pb2 import TrainingMetric


class Client:
    """A gRPC client that subscribes to training metrics from the server."""

    def __init__(self, target: str, timeout: float = 2.0) -> None:
        self.channel = grpc.insecure_channel(target)
        self.stub = TrainingStub(self.channel)
        self.timeout = timeout

    def publish(self, metric: Mapping[str, Any]) -> None:
        
        # Equivalent to const req = {...}
        req = TrainingMetric(
            epoch=int(metric['epoch']),
            batch=int(metric['batch']),
            batch_size=int(metric['batch_size']),
            batch_loss=float(metric['batch_loss']),
            preds=[int(x) for x in metric['preds']],
            truths=[int(x) for x in metric['truths']],
        )

        # Best-effort: set deadline; ignore transient failures or log as needed.
        try:
            # Equivalent to axios.post('/Publish', req)
            self.stub.Publish(req, timeout=self.timeout)

        except grpc.RpcError:
            # TODO: add logging / metrics / retry policy if desired
            pass

    
    
    def close(self) -> None:
        self.channel.close()
