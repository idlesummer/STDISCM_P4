from queue import Queue, Empty
from typing import Iterator, Callable
from grpc import ServicerContext
import grpc

from src.proto import metrics_pb2_grpc as pbg
from src.proto.metrics_pb2 import (
    StatusReq,
    StatusRes,
    StartReq,
    StartRes,
    SubscribeReq,
    TrainingMetric,
)


class Servicer(pbg.TrainingServicer):
    """Implements the metrics gRPC service with streaming support."""
    
    queue: Queue
    on_start: Callable[[int], None]
    is_started: bool
    epoch: int

    def __init__(self, queue: Queue, on_start: Callable[[int], None]) -> None:
        self.queue = queue
        self.on_start = on_start
        self.is_started = False
        self.epoch = 0

    def Status(self, req: StatusReq, ctx: ServicerContext) -> StatusRes:
        """Check server status (handshake/health check)."""
        if self.is_started:
            return StatusRes(status='training', message='Training in progress', epoch=self.epoch)
        else:
            return StatusRes(status='ready', message='Server ready to start training', epoch=0)

    def Start(self, req: StartReq, ctx: ServicerContext) -> StartRes:
        """Start training with epochs and confirmation (stateless)."""
  
        # Check if already training
        if self.is_started:
            return StartRes(status='already_running', message='Training is already in progress')

        # Require confirmation
        if not req.confirmed:
            return StartRes(status='not_confirmed', message='Set confirmed=true to start training')

        # Start training
        num_epochs = req.num_epochs or 3
        self.is_started = True
        self.epoch = 0
        self.on_start(num_epochs)
        return StartRes(status='started', message=f'Training started for {num_epochs} epochs')

    def Subscribe(self, req: SubscribeReq, ctx: ServicerContext) -> Iterator[TrainingMetric]:
        """Stream metrics to subscribers as they arrive."""
        try:
            # Check if client disconnected
            while ctx.is_active():
                try: 
                    metric = self.queue.get(timeout=1.0)  # Block until a metric is available
                except Empty: 
                    continue                                # No metric yet, loop again

                # Convert dict to protobuf message
                yield TrainingMetric(
                    epoch=int(metric['epoch']),
                    batch=int(metric['batch']),
                    batch_size=int(metric['batch_size']),
                    batch_loss=float(metric['batch_loss']),
                    preds=[int(x) for x in metric['preds']],
                    truths=[int(x) for x in metric['truths']],
                )

        except Exception as e:
            # Abort the RPC with INTERNAL error so the client knows something went wrong
            ctx.abort(grpc.StatusCode.INTERNAL, f"Streaming error: {e}")
