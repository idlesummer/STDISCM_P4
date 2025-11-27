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
        epoch_loss: float,
        image: torch.Tensor,  # The input image tensor
        predicted_label: int,  # The predicted label
        probabilities: torch.Tensor,  # Prediction probabilities (softmax output)
        ground_truth: int  # The actual label
    ) -> None:
        """Log a batch entry."""
        
        # Convert image tensor to bytes (for logging)
        image_bytes = self.tensor_to_bytes(image)
        
        # Append the log entry with the necessary details
        self.batch_logs.append(BatchLogEntry(
            iteration=iteration,
            batch=batch_idx,
            batch_loss=batch_loss,
            epoch=epoch_idx,
            epoch_loss=epoch_loss,
            image=image_bytes,
            predicted_label=predicted_label,
            probabilities=probabilities.tolist(),  # Convert tensor to list for storage
            ground_truth=ground_truth
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
