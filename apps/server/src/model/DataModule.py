from torchvision import datasets, transforms
from torch.utils.data import DataLoader


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
        
        train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        test_loader = DataLoader(test_dataset, batch_size=self.batch_size, shuffle=False)
        
        return train_loader, test_loader
