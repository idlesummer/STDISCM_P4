from dataclasses import dataclass


@dataclass
class BatchLogEntry:
    """Dataclass for logging batch information."""

    iteration: int
    epoch: int
    batch: int
    images: list[bytes]              # Store all images in batch as bytes
    predictions: list[int]           # Store predictions for all images
    probabilities: list[list[float]] # Store probabilities for all images
    ground_truths: list[int]         # Store ground truths for all images
    batch_loss: float
