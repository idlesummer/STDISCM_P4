from queue import Queue
from typing import TypedDict
from torch import nn, Tensor
from torch.optim import Optimizer
from torch.utils.data import DataLoader


class TrainingMetric(TypedDict):
    """Training metrics for a single batch."""

    epoch: int
    batch: int
    batch_size: int
    batch_loss: float
    preds: list[int]
    truths: list[int]


class Trainer:
    """Trains a PyTorch model with convergence detection and metric tracking."""
    
    model: nn.Module
    criterion: nn.Module
    optimizer: Optimizer
    dataloader: DataLoader
    tolerance: float                        # Minimum loss change required to continue training
    converged: bool                         # True if training stopped due to convergence
    metrics: Queue[TrainingMetric | None]   # Queue of batch metrics for async consumption
    update_interval: int                    # Record metrics every N batches
  
    def __init__(self, model: nn.Module, criterion: nn.Module, 
                 optimizer: Optimizer, dataloader: DataLoader, 
                 tolerance: float = 0.001, update_interval: int = 1) -> None:

        self.model = model
        self.criterion = criterion
        self.optimizer = optimizer
        self.dataloader = dataloader
        self.tolerance = tolerance
        self.converged = False
        self.metrics = Queue()
        self.update_interval = update_interval

    def train_batch(self, inputs: Tensor, targets: Tensor) -> tuple[float, list[int], list[int]]:
        """Train on a single batch and return loss, predictions, and ground truths."""
    
        # Standard training step
        self.optimizer.zero_grad(set_to_none=True)
        outputs = self.model(inputs)
        loss = self.criterion(outputs, targets)
        loss.backward()
        self.optimizer.step()

        # Extract predictions and targets
        preds = outputs.argmax(dim=-1).tolist()
        truths = targets.tolist()
        return loss.item(), preds, truths

    def train_epoch(self, epoch: int) -> float:
        """Train for one epoch and return average loss."""
        self.model.train()
        running_loss = 0.0

        num_batches = len(self.dataloader)  # guard for last-batch check
        for batch, (inputs, targets) in enumerate(self.dataloader):
            batch_loss, preds, truths = self.train_batch(inputs, targets)
            running_loss += batch_loss

            # Record at interval boundaries, and always for the final batch
            is_update_boundary = batch % self.update_interval == 0
            is_last_batch = batch == num_batches - 1
  
            if is_update_boundary or is_last_batch:
                self.metrics.put({
                    'epoch': epoch,
                    'batch': batch,
                    'batch_size': int(inputs.shape[0]),
                    'batch_loss': batch_loss,
                    'preds': preds,
                    'truths': truths,
                })

        return running_loss / len(self.dataloader)

    def train(self, num_epochs: int) -> None:
        """Train for multiple epochs, stopping early if loss converges."""
        prev_loss = float('inf')

        for epoch in range(num_epochs):
            epoch_loss = self.train_epoch(epoch)
            delta_loss = prev_loss - epoch_loss

            # Stop if loss change is smaller than tolerance
            if abs(delta_loss) < self.tolerance: 
                self.converged = True
                break

            prev_loss = epoch_loss
