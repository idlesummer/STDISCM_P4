from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class TrainingStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN: _ClassVar[TrainingStatus]
    INITIALIZING: _ClassVar[TrainingStatus]
    RUNNING: _ClassVar[TrainingStatus]
    PAUSED: _ClassVar[TrainingStatus]
    COMPLETED: _ClassVar[TrainingStatus]
    FAILED: _ClassVar[TrainingStatus]
UNKNOWN: TrainingStatus
INITIALIZING: TrainingStatus
RUNNING: TrainingStatus
PAUSED: TrainingStatus
COMPLETED: TrainingStatus
FAILED: TrainingStatus

class MetricsRequest(_message.Message):
    __slots__ = ("session_id", "timestamp_ms", "batch_data", "epoch_data", "performance_data", "status_update", "heartbeat")
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    BATCH_DATA_FIELD_NUMBER: _ClassVar[int]
    EPOCH_DATA_FIELD_NUMBER: _ClassVar[int]
    PERFORMANCE_DATA_FIELD_NUMBER: _ClassVar[int]
    STATUS_UPDATE_FIELD_NUMBER: _ClassVar[int]
    HEARTBEAT_FIELD_NUMBER: _ClassVar[int]
    session_id: str
    timestamp_ms: int
    batch_data: BatchData
    epoch_data: EpochData
    performance_data: PerformanceData
    status_update: StatusUpdate
    heartbeat: Heartbeat
    def __init__(self, session_id: _Optional[str] = ..., timestamp_ms: _Optional[int] = ..., batch_data: _Optional[_Union[BatchData, _Mapping]] = ..., epoch_data: _Optional[_Union[EpochData, _Mapping]] = ..., performance_data: _Optional[_Union[PerformanceData, _Mapping]] = ..., status_update: _Optional[_Union[StatusUpdate, _Mapping]] = ..., heartbeat: _Optional[_Union[Heartbeat, _Mapping]] = ...) -> None: ...

class BatchData(_message.Message):
    __slots__ = ("epoch", "batch_idx", "batch_size", "images", "predictions", "ground_truth", "batch_loss", "batch_accuracy", "timestamp_ms")
    EPOCH_FIELD_NUMBER: _ClassVar[int]
    BATCH_IDX_FIELD_NUMBER: _ClassVar[int]
    BATCH_SIZE_FIELD_NUMBER: _ClassVar[int]
    IMAGES_FIELD_NUMBER: _ClassVar[int]
    PREDICTIONS_FIELD_NUMBER: _ClassVar[int]
    GROUND_TRUTH_FIELD_NUMBER: _ClassVar[int]
    BATCH_LOSS_FIELD_NUMBER: _ClassVar[int]
    BATCH_ACCURACY_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    epoch: int
    batch_idx: int
    batch_size: int
    images: _containers.RepeatedCompositeFieldContainer[ImageData]
    predictions: _containers.RepeatedCompositeFieldContainer[Prediction]
    ground_truth: _containers.RepeatedScalarFieldContainer[int]
    batch_loss: float
    batch_accuracy: float
    timestamp_ms: int
    def __init__(self, epoch: _Optional[int] = ..., batch_idx: _Optional[int] = ..., batch_size: _Optional[int] = ..., images: _Optional[_Iterable[_Union[ImageData, _Mapping]]] = ..., predictions: _Optional[_Iterable[_Union[Prediction, _Mapping]]] = ..., ground_truth: _Optional[_Iterable[int]] = ..., batch_loss: _Optional[float] = ..., batch_accuracy: _Optional[float] = ..., timestamp_ms: _Optional[int] = ...) -> None: ...

class ImageData(_message.Message):
    __slots__ = ("image_bytes", "format", "width", "height", "channels", "image_id")
    IMAGE_BYTES_FIELD_NUMBER: _ClassVar[int]
    FORMAT_FIELD_NUMBER: _ClassVar[int]
    WIDTH_FIELD_NUMBER: _ClassVar[int]
    HEIGHT_FIELD_NUMBER: _ClassVar[int]
    CHANNELS_FIELD_NUMBER: _ClassVar[int]
    IMAGE_ID_FIELD_NUMBER: _ClassVar[int]
    image_bytes: bytes
    format: str
    width: int
    height: int
    channels: int
    image_id: str
    def __init__(self, image_bytes: _Optional[bytes] = ..., format: _Optional[str] = ..., width: _Optional[int] = ..., height: _Optional[int] = ..., channels: _Optional[int] = ..., image_id: _Optional[str] = ...) -> None: ...

class Prediction(_message.Message):
    __slots__ = ("predicted_class", "predicted_label", "confidence", "top_k_scores")
    PREDICTED_CLASS_FIELD_NUMBER: _ClassVar[int]
    PREDICTED_LABEL_FIELD_NUMBER: _ClassVar[int]
    CONFIDENCE_FIELD_NUMBER: _ClassVar[int]
    TOP_K_SCORES_FIELD_NUMBER: _ClassVar[int]
    predicted_class: int
    predicted_label: str
    confidence: float
    top_k_scores: _containers.RepeatedCompositeFieldContainer[ClassScore]
    def __init__(self, predicted_class: _Optional[int] = ..., predicted_label: _Optional[str] = ..., confidence: _Optional[float] = ..., top_k_scores: _Optional[_Iterable[_Union[ClassScore, _Mapping]]] = ...) -> None: ...

class ClassScore(_message.Message):
    __slots__ = ("class_idx", "label", "score")
    CLASS_IDX_FIELD_NUMBER: _ClassVar[int]
    LABEL_FIELD_NUMBER: _ClassVar[int]
    SCORE_FIELD_NUMBER: _ClassVar[int]
    class_idx: int
    label: str
    score: float
    def __init__(self, class_idx: _Optional[int] = ..., label: _Optional[str] = ..., score: _Optional[float] = ...) -> None: ...

class EpochData(_message.Message):
    __slots__ = ("epoch", "average_loss", "average_accuracy", "learning_rate", "is_converged", "validation_loss", "validation_accuracy", "timestamp_ms")
    EPOCH_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_LOSS_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_ACCURACY_FIELD_NUMBER: _ClassVar[int]
    LEARNING_RATE_FIELD_NUMBER: _ClassVar[int]
    IS_CONVERGED_FIELD_NUMBER: _ClassVar[int]
    VALIDATION_LOSS_FIELD_NUMBER: _ClassVar[int]
    VALIDATION_ACCURACY_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    epoch: int
    average_loss: float
    average_accuracy: float
    learning_rate: float
    is_converged: bool
    validation_loss: float
    validation_accuracy: float
    timestamp_ms: int
    def __init__(self, epoch: _Optional[int] = ..., average_loss: _Optional[float] = ..., average_accuracy: _Optional[float] = ..., learning_rate: _Optional[float] = ..., is_converged: bool = ..., validation_loss: _Optional[float] = ..., validation_accuracy: _Optional[float] = ..., timestamp_ms: _Optional[int] = ...) -> None: ...

class PerformanceData(_message.Message):
    __slots__ = ("time_per_batch_ms", "total_time_for_epoch_sec", "estimated_time_remaining_sec", "current_fps", "average_fps", "resource_usage", "timestamp_ms")
    TIME_PER_BATCH_MS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_TIME_FOR_EPOCH_SEC_FIELD_NUMBER: _ClassVar[int]
    ESTIMATED_TIME_REMAINING_SEC_FIELD_NUMBER: _ClassVar[int]
    CURRENT_FPS_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_FPS_FIELD_NUMBER: _ClassVar[int]
    RESOURCE_USAGE_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    time_per_batch_ms: float
    total_time_for_epoch_sec: float
    estimated_time_remaining_sec: float
    current_fps: float
    average_fps: float
    resource_usage: ResourceUsage
    timestamp_ms: int
    def __init__(self, time_per_batch_ms: _Optional[float] = ..., total_time_for_epoch_sec: _Optional[float] = ..., estimated_time_remaining_sec: _Optional[float] = ..., current_fps: _Optional[float] = ..., average_fps: _Optional[float] = ..., resource_usage: _Optional[_Union[ResourceUsage, _Mapping]] = ..., timestamp_ms: _Optional[int] = ...) -> None: ...

class ResourceUsage(_message.Message):
    __slots__ = ("cpu_percent", "memory_mb", "gpu_percent", "gpu_memory_mb")
    CPU_PERCENT_FIELD_NUMBER: _ClassVar[int]
    MEMORY_MB_FIELD_NUMBER: _ClassVar[int]
    GPU_PERCENT_FIELD_NUMBER: _ClassVar[int]
    GPU_MEMORY_MB_FIELD_NUMBER: _ClassVar[int]
    cpu_percent: float
    memory_mb: float
    gpu_percent: float
    gpu_memory_mb: float
    def __init__(self, cpu_percent: _Optional[float] = ..., memory_mb: _Optional[float] = ..., gpu_percent: _Optional[float] = ..., gpu_memory_mb: _Optional[float] = ...) -> None: ...

class StatusUpdate(_message.Message):
    __slots__ = ("status", "message", "config", "timestamp_ms")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    status: TrainingStatus
    message: str
    config: TrainingConfig
    timestamp_ms: int
    def __init__(self, status: _Optional[_Union[TrainingStatus, str]] = ..., message: _Optional[str] = ..., config: _Optional[_Union[TrainingConfig, _Mapping]] = ..., timestamp_ms: _Optional[int] = ...) -> None: ...

class TrainingConfig(_message.Message):
    __slots__ = ("total_epochs", "batches_per_epoch", "batch_size", "model_name", "dataset_name", "class_names")
    TOTAL_EPOCHS_FIELD_NUMBER: _ClassVar[int]
    BATCHES_PER_EPOCH_FIELD_NUMBER: _ClassVar[int]
    BATCH_SIZE_FIELD_NUMBER: _ClassVar[int]
    MODEL_NAME_FIELD_NUMBER: _ClassVar[int]
    DATASET_NAME_FIELD_NUMBER: _ClassVar[int]
    CLASS_NAMES_FIELD_NUMBER: _ClassVar[int]
    total_epochs: int
    batches_per_epoch: int
    batch_size: int
    model_name: str
    dataset_name: str
    class_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, total_epochs: _Optional[int] = ..., batches_per_epoch: _Optional[int] = ..., batch_size: _Optional[int] = ..., model_name: _Optional[str] = ..., dataset_name: _Optional[str] = ..., class_names: _Optional[_Iterable[str]] = ...) -> None: ...

class Heartbeat(_message.Message):
    __slots__ = ("timestamp_ms", "sequence_number")
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    SEQUENCE_NUMBER_FIELD_NUMBER: _ClassVar[int]
    timestamp_ms: int
    sequence_number: int
    def __init__(self, timestamp_ms: _Optional[int] = ..., sequence_number: _Optional[int] = ...) -> None: ...

class MetricsResponse(_message.Message):
    __slots__ = ("session_id", "timestamp_ms", "ack", "command", "error")
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    ACK_FIELD_NUMBER: _ClassVar[int]
    COMMAND_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    session_id: str
    timestamp_ms: int
    ack: Acknowledgment
    command: ControlCommand
    error: ErrorResponse
    def __init__(self, session_id: _Optional[str] = ..., timestamp_ms: _Optional[int] = ..., ack: _Optional[_Union[Acknowledgment, _Mapping]] = ..., command: _Optional[_Union[ControlCommand, _Mapping]] = ..., error: _Optional[_Union[ErrorResponse, _Mapping]] = ...) -> None: ...

class Acknowledgment(_message.Message):
    __slots__ = ("batch_idx", "success")
    BATCH_IDX_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    batch_idx: int
    success: bool
    def __init__(self, batch_idx: _Optional[int] = ..., success: bool = ...) -> None: ...

class ControlCommand(_message.Message):
    __slots__ = ("type", "parameters")
    class CommandType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        UNKNOWN_COMMAND: _ClassVar[ControlCommand.CommandType]
        PAUSE_TRAINING: _ClassVar[ControlCommand.CommandType]
        RESUME_TRAINING: _ClassVar[ControlCommand.CommandType]
        STOP_TRAINING: _ClassVar[ControlCommand.CommandType]
        ADJUST_BATCH_SIZE: _ClassVar[ControlCommand.CommandType]
        CHANGE_LEARNING_RATE: _ClassVar[ControlCommand.CommandType]
    UNKNOWN_COMMAND: ControlCommand.CommandType
    PAUSE_TRAINING: ControlCommand.CommandType
    RESUME_TRAINING: ControlCommand.CommandType
    STOP_TRAINING: ControlCommand.CommandType
    ADJUST_BATCH_SIZE: ControlCommand.CommandType
    CHANGE_LEARNING_RATE: ControlCommand.CommandType
    class ParametersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    TYPE_FIELD_NUMBER: _ClassVar[int]
    PARAMETERS_FIELD_NUMBER: _ClassVar[int]
    type: ControlCommand.CommandType
    parameters: _containers.ScalarMap[str, str]
    def __init__(self, type: _Optional[_Union[ControlCommand.CommandType, str]] = ..., parameters: _Optional[_Mapping[str, str]] = ...) -> None: ...

class ErrorResponse(_message.Message):
    __slots__ = ("code", "message")
    class ErrorCode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        UNKNOWN_ERROR: _ClassVar[ErrorResponse.ErrorCode]
        INVALID_SESSION: _ClassVar[ErrorResponse.ErrorCode]
        INVALID_DATA: _ClassVar[ErrorResponse.ErrorCode]
        BUFFER_FULL: _ClassVar[ErrorResponse.ErrorCode]
        INTERNAL_ERROR: _ClassVar[ErrorResponse.ErrorCode]
    UNKNOWN_ERROR: ErrorResponse.ErrorCode
    INVALID_SESSION: ErrorResponse.ErrorCode
    INVALID_DATA: ErrorResponse.ErrorCode
    BUFFER_FULL: ErrorResponse.ErrorCode
    INTERNAL_ERROR: ErrorResponse.ErrorCode
    CODE_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    code: ErrorResponse.ErrorCode
    message: str
    def __init__(self, code: _Optional[_Union[ErrorResponse.ErrorCode, str]] = ..., message: _Optional[str] = ...) -> None: ...

class SessionInfo(_message.Message):
    __slots__ = ("session_id", "client_name", "client_version", "config", "timestamp_ms")
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    CLIENT_NAME_FIELD_NUMBER: _ClassVar[int]
    CLIENT_VERSION_FIELD_NUMBER: _ClassVar[int]
    CONFIG_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_MS_FIELD_NUMBER: _ClassVar[int]
    session_id: str
    client_name: str
    client_version: str
    config: TrainingConfig
    timestamp_ms: int
    def __init__(self, session_id: _Optional[str] = ..., client_name: _Optional[str] = ..., client_version: _Optional[str] = ..., config: _Optional[_Union[TrainingConfig, _Mapping]] = ..., timestamp_ms: _Optional[int] = ...) -> None: ...

class SessionResponse(_message.Message):
    __slots__ = ("success", "session_id", "message", "server_config")
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    SERVER_CONFIG_FIELD_NUMBER: _ClassVar[int]
    success: bool
    session_id: str
    message: str
    server_config: ServerConfig
    def __init__(self, success: bool = ..., session_id: _Optional[str] = ..., message: _Optional[str] = ..., server_config: _Optional[_Union[ServerConfig, _Mapping]] = ...) -> None: ...

class ServerConfig(_message.Message):
    __slots__ = ("max_batch_size", "max_image_dimension", "heartbeat_interval_ms", "buffer_size")
    MAX_BATCH_SIZE_FIELD_NUMBER: _ClassVar[int]
    MAX_IMAGE_DIMENSION_FIELD_NUMBER: _ClassVar[int]
    HEARTBEAT_INTERVAL_MS_FIELD_NUMBER: _ClassVar[int]
    BUFFER_SIZE_FIELD_NUMBER: _ClassVar[int]
    max_batch_size: int
    max_image_dimension: int
    heartbeat_interval_ms: int
    buffer_size: int
    def __init__(self, max_batch_size: _Optional[int] = ..., max_image_dimension: _Optional[int] = ..., heartbeat_interval_ms: _Optional[int] = ..., buffer_size: _Optional[int] = ...) -> None: ...
