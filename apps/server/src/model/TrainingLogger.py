from   io import BytesIO
from   PIL import Image
import torch
from   src.types.BatchLogEntry import BatchLogEntry 


class TrainingLogger:
    batch_logs: list[BatchLogEntry]
  
    def __init__(self):
        self.batch_logs = []  # Holds batch log entries


    def log_batch(
        self,
        epoch_idx: int,
        batch_idx: int,
        batch_loss: float,
        iteration: int,
        images: torch.Tensor,         # All input image tensors in the batch
        predictions: list[int],       # All predicted labels
        probabilities: list[list[float]],  # All prediction probabilities
        ground_truths: list[int]      # All actual labels
    ) -> None:
        """Log a batch entry."""

        # Convert all image tensors to bytes
        images_bytes = [self.tensor_to_bytes(img) for img in images]

        # Append the log entry with the necessary details
        self.batch_logs.append(BatchLogEntry(
            iteration=iteration,
            batch=batch_idx,
            batch_loss=batch_loss,
            epoch=epoch_idx,
            images=images_bytes,
            predictions=predictions,
            probabilities=probabilities,
            ground_truths=ground_truths
        ))


    def get_batch_logs(self) -> list[BatchLogEntry]:
        """Return all batch logs."""
        return self.batch_logs


    def tensor_to_bytes(self, image: torch.Tensor) -> bytes:
        """Convert a tensor to a byte representation (JPEG format)."""
        # Convert the tensor to a PIL image
        image = image.squeeze(0)  # Remove batch dimension if it's there
        image = image.permute(1, 2, 0)  # Convert from (C, H, W) to (H, W, C)
        image_np = image.cpu().numpy().astype('uint8')  # Convert to numpy and ensure type
        
        pil_image = Image.fromarray(image_np)  # Convert to PIL Image
        
        # Save the image to a BytesIO object as JPEG
        with BytesIO() as byte_io:
            pil_image.save(byte_io, format="JPEG")
            return byte_io.getvalue()  # Return the byte data
