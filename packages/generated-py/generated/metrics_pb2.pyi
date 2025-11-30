from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class Metric(_message.Message):
    __slots__ = ("epoch", "batch", "batch_size", "batch_loss", "predictions", "truths")
    EPOCH_FIELD_NUMBER: _ClassVar[int]
    BATCH_FIELD_NUMBER: _ClassVar[int]
    BATCH_SIZE_FIELD_NUMBER: _ClassVar[int]
    BATCH_LOSS_FIELD_NUMBER: _ClassVar[int]
    PREDICTIONS_FIELD_NUMBER: _ClassVar[int]
    TRUTHS_FIELD_NUMBER: _ClassVar[int]
    epoch: int
    batch: int
    batch_size: int
    batch_loss: float
    predictions: _containers.RepeatedScalarFieldContainer[int]
    truths: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, epoch: _Optional[int] = ..., batch: _Optional[int] = ..., batch_size: _Optional[int] = ..., batch_loss: _Optional[float] = ..., predictions: _Optional[_Iterable[int]] = ..., truths: _Optional[_Iterable[int]] = ...) -> None: ...

class PublishReply(_message.Message):
    __slots__ = ("status",)
    STATUS_FIELD_NUMBER: _ClassVar[int]
    status: str
    def __init__(self, status: _Optional[str] = ...) -> None: ...
