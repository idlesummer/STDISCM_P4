import logging
import torch
import torch.nn as nn
import torch.optim as optim
from   torch.utils.data import DataLoader
from   src.model.TrainingLogger import TrainingLogger
from   src.types.BatchLogEntry import BatchLogEntry


# Set up logging for this module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Trainer:
    """Trainer for training a neural network."""
    
    def __init__(
        self, 
        model: nn.Module, 
        optimizer: optim.Optimizer, 
        criterion: nn.Module,
        data_loader: DataLoader, 
        max_epochs: int = 1000, 
        threshold: float = 0.00005
    ):
        """
        Initialize the trainer with the model, optimizer, loss function, and data loader.
        
        :param model:       The model being trained.
        :param optimizer:   Optimizer (e.g., SGD, Adam).
        :param criterion:   Loss function (e.g., CrossEntropyLoss).
        :param data_loader: DataLoader for loading batches.
        :param max_epochs:  Maximum number of epochs for training.
        :param threshold:   Threshold for convergence. Training stops if the loss change is below this.
        """
        self.model = model
        self.optimizer = optimizer
        self.criterion = criterion
        self.data_loader = data_loader
        self.max_epochs = max_epochs
        self.threshold = threshold
        self.losses = []
        self.previous_loss = float('inf')
        self.is_converged = False
        self.logger = TrainingLogger()


    def train(self) -> None:
        """Train the model for a given number of epochs until convergence."""

        # Initialize the flag
        self.is_converged = False

        # Start the training loop
        for epoch in range(self.max_epochs):

            # Set model to training mode
            self.model.train()
            epoch_loss = 0

            # Iterate through the DataLoader to get batches
            for batch, (X_batch, y_batch) in enumerate(self.data_loader):
                batch_loss = self.train_batch(epoch, batch, X_batch, y_batch)
                epoch_loss += batch_loss

            # Calculate average loss for the epoch
            average_loss = epoch_loss / len(self.data_loader)
            self.losses.append(average_loss)

            # Display the average loss per epoch
            logger.info(f"Epoch {epoch + 1}/{self.max_epochs}, Loss: {average_loss:.6f}")

            # Check for convergence using early stopping
            if abs(self.previous_loss - average_loss) < self.threshold:
                self.is_converged = True
                logger.info(f"Training converged at epoch {epoch + 1}.")
                break
            self.previous_loss = average_loss

        else:
            # If the loop finishes without breaking/converging
            logger.warning(f"Training finished after {self.max_epochs} epochs. Convergence threshold was not met.")


    def train_batch(
        self,
        epoch: int,
        batch: int,
        X_batch: torch.Tensor,
        y_batch: torch.Tensor,
    ) -> float:
        """Train the model on a single batch and log the batch information."""

        X_batch = X_batch.float()                       # Ensure tensors are of the correct dtype for labels
        y_batch = y_batch.long()                        # Ensure labels are in long type for classification

        self.optimizer.zero_grad()                      # Empty the gradients of the network
        scores = self.model(X_batch)                    # Forward propagation
        loss = self.criterion(scores, y_batch)          # Compute the loss
        loss.backward()                                 # Backward propagation
        self.optimizer.step()                           # Update parameters

        # Get prediction probabilities and predicted labels for ALL images in batch
        probabilities = torch.softmax(scores, dim=1)
        predicted_labels = torch.argmax(probabilities, dim=1)

        # Convert all images to bytes
        images_bytes = [self.logger.tensor_to_bytes(img) for img in X_batch]

        # Create and log batch entry
        self.logger.log_batch(BatchLogEntry(
            iteration=(epoch * len(self.data_loader) + batch),
            batch=batch,
            batch_loss=loss.item(),
            epoch=epoch,
            images=images_bytes,
            predictions=predicted_labels.tolist(),
            probabilities=probabilities.tolist(),
            ground_truths=y_batch.tolist(),
        ))

        # Return the loss for the current batch
        return loss.item()  


    def evaluate(self, val_loader: DataLoader) -> float:
        """Evaluate the model on the validation data."""

        # Set the model to evaluation mode
        self.model.eval()  
        total_loss = 0

        # Disable gradient computation during evaluation
        with torch.no_grad():                       
            for X, y in val_loader:
                X = X.float()                       # Ensure input is in float32
                y = y.long()                        # Ensure labels are in long type

                scores, _ = self.model(X)
                loss = self.criterion(scores, y)
                total_loss += loss.item()

        average_val_loss = total_loss / len(val_loader)
        logger.info(f"Validation Loss: {average_val_loss:.6f}")
        return average_val_loss
