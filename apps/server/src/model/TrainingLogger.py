from   io import BytesIO
from   PIL import Image
import torch
from   src.types.BatchLogEntry import BatchLogEntry 


class TrainingLogger:
    batch_logs: list[BatchLogEntry]
  
    def __init__(self):
        self.batch_logs = []  # Holds batch log entries


    def log_batch(self, entry: BatchLogEntry) -> None:
        """Log a batch entry."""
        self.batch_logs.append(entry)


    def get_batch_logs(self) -> list[BatchLogEntry]:
        """Return all batch logs."""
        return self.batch_logs


    @staticmethod
    def tensor_to_bytes(image: torch.Tensor) -> bytes:
        """Convert a tensor to a byte representation (JPEG format)."""
        # Validate tensor dimensions
        if image.dim() not in (2, 3):
            raise ValueError(f"Expected 2D or 3D tensor, got {image.dim()}D tensor with shape {image.shape}")

        # Convert the tensor to a PIL image
        # MNIST images are grayscale (1, 28, 28) and normalized to [0, 1]
        image = image.squeeze()                                    # Remove all singleton dimensions

        # Clamp values to [0, 1] to handle potential numerical instability
        image = torch.clamp(image, 0, 1)
        image_np = (image * 255).cpu().numpy().astype('uint8')     # Scale to [0, 255] and convert to numpy

        # Convert to PIL Image (mode='L' for grayscale)
        pil_image = Image.fromarray(image_np, mode='L')

        # Save the image to a BytesIO object as JPEG
        with BytesIO() as byte_io:
            pil_image.save(byte_io, format="JPEG")

            # Return the byte data
            return byte_io.getvalue()
