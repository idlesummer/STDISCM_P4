from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Dataset
from typing import Any


class IndexedDataset(Dataset):
    """Wrapper dataset that returns (index, image, label) instead of (image, label)."""

    def __init__(self, base_dataset: Dataset):
        self.base_dataset = base_dataset

    def __len__(self) -> int:
        return len(self.base_dataset)

    def __getitem__(self, idx: int) -> tuple[int, Any, Any]:
        image, label = self.base_dataset[idx]
        return idx, image, label


class DataModule:
    """Encapsulates MNIST data loading."""
    
    root: str
    batch_size: int
    download: bool
    
    def __init__(self, root = './data', batch_size = 64, download = True):
        self.root = root
        self.batch_size = batch_size
        self.download = download
        
        # Standard MNIST normalization
        self.transform = transforms.Compose([transforms.ToTensor()])
    
    def get_loaders(self) -> tuple[DataLoader, DataLoader]:
        """Return train and test dataloaders."""

        train_dataset = datasets.MNIST(
            self.root, train=True, download=self.download, transform=self.transform
        )
        test_dataset = datasets.MNIST(
            self.root, train=False, download=self.download, transform=self.transform
        )

        # Wrap datasets to return indices along with data
        indexed_train = IndexedDataset(train_dataset)
        indexed_test = IndexedDataset(test_dataset)

        train_loader = DataLoader(indexed_train, batch_size=self.batch_size, shuffle=True)
        test_loader = DataLoader(indexed_test, batch_size=self.batch_size, shuffle=False)

        return train_loader, test_loader
