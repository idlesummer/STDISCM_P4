import pytorch_lightning as pl
import torch
import torch.nn as nn
from torch.optim import Optimizer


class LightningModel(pl.LightningModule):
    def __init__(self) -> None:
        """
        A simple model that inherits from LightningModule.
        Defines a fully connected layer as an example.
        """
        super(LightningModel, self).__init__()
        self.fc = nn.Linear(128, 10)  # Example layer (input of size 128, output of size 10)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        The forward pass of the model. 

        :param x: The input tensor.
        :return: The output of the model after applying the forward pass.
        """
        return self.fc(x)

    def training_step(self, batch: tuple, batch_idx: int) -> torch.Tensor:
        """
        The training step where we calculate the loss for one batch of data.

        :param batch: A tuple containing the inputs and labels for the batch.
        :param batch_idx: The index of the batch (can be used for debugging).
        :return: The loss for this batch.
        """
        inputs, labels = batch
        outputs = self(inputs)
        loss = torch.nn.functional.cross_entropy(outputs, labels)
        return loss

    def validation_step(self, batch: tuple, batch_idx: int) -> Dict[str, torch.Tensor]:
        """
        The validation step. This computes the loss for validation data.

        :param batch: A tuple containing the inputs and labels for the batch.
        :param batch_idx: The index of the batch.
        :return: A dictionary containing the loss.
        """
        inputs, labels = batch
        outputs = self(inputs)
        loss = torch.nn.functional.cross_entropy(outputs, labels)
        return {"val_loss": loss}

    def validation_epoch_end(self, outputs: list) -> dict[str, torch.Tensor]:
        """
        Aggregates the outputs from all validation steps and computes metrics for the epoch.

        :param outputs: The list of outputs from the validation steps.
        :return: A dictionary containing the average validation loss.
        """
        val_loss_mean = torch.stack([x["val_loss"] for x in outputs]).mean()
        return {"val_loss": val_loss_mean}

    def configure_optimizers(self) -> Optimizer:
        """Defines and returns the optimizer to use for training."""
        optimizer = torch.optim.Adam(self.parameters(), lr=0.001)
        return optimizer

