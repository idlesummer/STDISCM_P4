from dataclasses import dataclass


@dataclass
class BatchLogEntry:
    """Dataclass for logging batch information."""

    iteration: int
    batch: int
    batch_loss: float
    epoch: int
    images: list[bytes]              # Store all images in batch as bytes
    predictions: list[int]           # Store predictions for all images
    probabilities: list[list[float]] # Store probabilities for all images
    ground_truths: list[int]         # Store ground truths for all images
