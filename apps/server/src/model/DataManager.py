from typing import Optional, Any
import torch
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import datasets, transforms


class DatasetManager:
    dataset_name: str = 'MNIST'  # Only supports MNIST dataset
    root: str
    batch_size: int
    val_size: float
    test_size: float
    transform: transforms.Compose
    seed: int
    dataset: Dataset[Any]
    train_dataset: Dataset[Any]
    val_dataset: Dataset[Any]
    test_dataset: Dataset[Any]

    def __init__(
        self,
        root: str = './data',
        batch_size: int = 16,
        val_size: float = 0.1,
        test_size: float = 0.1,
        transform: Optional[transforms.Compose] = None,
        seed: int = 0
    ) -> None:
        """
        Initializes the DatasetManager class for MNIST dataset.

        :param root: Directory to store the dataset
        :param batch_size: Batch size for the DataLoader
        :param val_size: Proportion of the dataset to use for validation
        :param test_size: Proportion of the dataset to use for testing
        :param transform: Transformations to apply to the dataset (e.g., ToTensor, Normalize)
        :param seed: Random seed for reproducibility
        """
        
        self.root = root
        self.batch_size = batch_size
        self.val_size = val_size
        self.test_size = test_size
        self.transform = transform or transforms.Compose([transforms.ToTensor()])
        self.seed = seed

        # Set the random seed for reproducibility
        torch.manual_seed(self.seed)

        # Load the MNIST dataset
        self.dataset = datasets.MNIST(root=self.root, train=True, download=True, transform=self.transform)

        # Split the dataset into train, validation, and test sets
        self.train_dataset, self.val_dataset, self.test_dataset = self.train_test_val_split()

    def get_dataloaders(self) -> tuple[DataLoader, DataLoader, DataLoader]:
        """Returns a tuple of DataLoaders for 'train', 'val', and 'test' splits"""
        
        # Create DataLoader for each dataset split
        train_loader = DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True)
        val_loader = DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False)
        test_loader = DataLoader(self.test_dataset, batch_size=self.batch_size, shuffle=False)
        
        # Return them as a tuple
        return train_loader, val_loader, test_loader

    def train_test_val_split(self) -> tuple[Dataset, Dataset, Dataset]:
        """Splits the MNIST dataset deterministically into train, validation, and test sets."""
        
        dataset_size = len(self.dataset)  # type: ignore

        # Calculate split sizes based on proportions
        train_size = int((1 - self.val_size - self.test_size) * dataset_size)
        val_size = int(self.val_size * dataset_size)
        test_size = int(self.test_size * dataset_size)
        
        # Perform the split using random_split with a deterministic generator
        train_dataset, val_dataset, test_dataset = random_split(self.dataset, [train_size, val_size, test_size])
        return train_dataset, val_dataset, test_dataset
