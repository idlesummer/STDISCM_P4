from dataclasses import dataclass


@dataclass
class BatchLogEntry:
    """Dataclass for logging batch information."""

    iteration: int
    batch: int
    batch_loss: float
    epoch: int
    epoch_loss: float
    image: bytes                # Store image as bytes
    predicted_label: int
    probabilities: list[float]  # Store probabilities as a list
    ground_truth: int
