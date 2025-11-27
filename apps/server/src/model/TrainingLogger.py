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
        # Convert the tensor to a PIL image
        image = image.squeeze(0)                        # Remove batch dimension if it's there
        image = image.permute(1, 2, 0)                  # Convert from (C, H, W) to (H, W, C)
        image_np = image.cpu().numpy().astype('uint8')  # Convert to numpy and ensure type
        
        # Convert to PIL Image
        pil_image = Image.fromarray(image_np)           
        
        # Save the image to a BytesIO object as JPEG
        with BytesIO() as byte_io:
            pil_image.save(byte_io, format="JPEG")
            
            # Return the byte data
            return byte_io.getvalue()
