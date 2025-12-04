from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class TrainingMetric(_message.Message):
    __slots__ = ("epoch", "batch", "batch_size", "batch_loss", "preds", "truths", "scores", "image_ids")
    EPOCH_FIELD_NUMBER: _ClassVar[int]
    BATCH_FIELD_NUMBER: _ClassVar[int]
    BATCH_SIZE_FIELD_NUMBER: _ClassVar[int]
    BATCH_LOSS_FIELD_NUMBER: _ClassVar[int]
    PREDS_FIELD_NUMBER: _ClassVar[int]
    TRUTHS_FIELD_NUMBER: _ClassVar[int]
    SCORES_FIELD_NUMBER: _ClassVar[int]
    IMAGE_IDS_FIELD_NUMBER: _ClassVar[int]
    epoch: int
    batch: int
    batch_size: int
    batch_loss: float
    preds: _containers.RepeatedScalarFieldContainer[int]
    truths: _containers.RepeatedScalarFieldContainer[int]
    scores: _containers.RepeatedScalarFieldContainer[float]
    image_ids: _containers.RepeatedScalarFieldContainer[int]
    def __init__(self, epoch: _Optional[int] = ..., batch: _Optional[int] = ..., batch_size: _Optional[int] = ..., batch_loss: _Optional[float] = ..., preds: _Optional[_Iterable[int]] = ..., truths: _Optional[_Iterable[int]] = ..., scores: _Optional[_Iterable[float]] = ..., image_ids: _Optional[_Iterable[int]] = ...) -> None: ...

class SubscribeReq(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class StatusReq(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class StatusRes(_message.Message):
    __slots__ = ("status", "message", "epoch")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    EPOCH_FIELD_NUMBER: _ClassVar[int]
    status: str
    message: str
    epoch: int
    def __init__(self, status: _Optional[str] = ..., message: _Optional[str] = ..., epoch: _Optional[int] = ...) -> None: ...

class StartReq(_message.Message):
    __slots__ = ("num_epochs", "confirmed")
    NUM_EPOCHS_FIELD_NUMBER: _ClassVar[int]
    CONFIRMED_FIELD_NUMBER: _ClassVar[int]
    num_epochs: int
    confirmed: bool
    def __init__(self, num_epochs: _Optional[int] = ..., confirmed: bool = ...) -> None: ...

class StartRes(_message.Message):
    __slots__ = ("status", "message")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    status: str
    message: str
    def __init__(self, status: _Optional[str] = ..., message: _Optional[str] = ...) -> None: ...
