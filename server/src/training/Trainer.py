from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Protocol
from torch.utils.data import DataLoader
from torch.nn import Module
from torch.optim import Optimizer
from torch import Tensor


class TrainerConfig(Protocol):
    model: Module
    criterion: Callable[[Tensor, Tensor], Tensor]
    optimizer: Optimizer


class FitConfig(Protocol):
    loader: DataLoader[Any]
    max_epochs: int
    convergence_threshold: float
    verbose: bool = True


class Trainer(ABC):
    """Encapsulates the training loop"""

    def __init__(self, config: TrainerConfig) -> None:
        """
        Args:
            model: Your nn.Module (NeuralNetwork instance)
            criterion: Loss function (torch.nn.CrossEntropyLoss, etc.)
            optimizer: Optimizer (torch.optim.SGD, etc.)
        """
        self.model = config.model
        self.criterion = config.criterion
        self.optimizer = config.optimizer

    @abstractmethod
    def fit(self, config: FitConfig) -> Dict[str, List[float]]:
        """Main training loop"""
        pass

    @abstractmethod
    def train_epoch(self, loader: DataLoader[Any]) -> float:
        """Train for one epoch"""
        pass

    @abstractmethod
    def evaluate(self, loader: DataLoader[Any]) -> float:
        """Evaluate model without training"""
        pass
