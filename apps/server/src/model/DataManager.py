import torch
from   torch.utils.data import DataLoader, random_split
from   torchvision import datasets, transforms


class DatasetManager:
    def __init__(self, dataset_name='MNIST', root='./data', batch_size=16, val_size=0.1, test_size=0.1, transform=None, seed=42):
        """
        Initializes the DatasetManager class.
        
        :param dataset_name: Name of the dataset (e.g., 'MNIST')
        :param root: Directory to store the dataset
        :param batch_size: Batch size for the DataLoader
        :param val_size: Proportion of the dataset to use for validation
        :param test_size: Proportion of the dataset to use for testing
        :param transform: Transformations to apply to the dataset (e.g., ToTensor, Normalize)
        :param seed: Random seed for reproducibility
        """
        self.dataset_name = dataset_name
        self.root = root
        self.batch_size = batch_size
        self.val_size = val_size
        self.test_size = test_size
        self.transform = transform if transform else transforms.Compose([transforms.ToTensor()])
        self.seed = seed
        
        # Set the random seed for reproducibility
        torch.manual_seed(self.seed)

        # Step 1: Load the dataset
        self.dataset = self._load_dataset()

        # Step 2: Split the dataset into train, validation, and test
        self.train_dataset, self.val_dataset, self.test_dataset = self._split_dataset()

    def _load_dataset(self):
        """Loads the dataset (in this case, MNIST)"""
        if self.dataset_name == 'MNIST':
            return datasets.MNIST(root=self.root, train=True, download=True, transform=self.transform)
        else:
            raise ValueError(f"Dataset '{self.dataset_name}' not supported yet.")

    def _split_dataset(self):
        """Splits the dataset deterministically into train, validation, and test sets"""
        dataset_size = len(self.dataset)
        
        # Calculate split sizes based on proportions
        train_size = int((1 - self.val_size - self.test_size) * dataset_size)
        val_size = int(self.val_size * dataset_size)
        test_size = dataset_size - train_size - val_size
        
        # Perform the split using random_split
        train_dataset, val_dataset, test_dataset = random_split(self.dataset, [train_size, val_size, test_size])
        
        return train_dataset, val_dataset, test_dataset

    def get_dataloader(self, split='train'):
        """Returns a DataLoader for the specified split ('train', 'val', or 'test')"""
        if split == 'train':
            dataset = self.train_dataset
        elif split == 'val':
            dataset = self.val_dataset
        elif split == 'test':
            dataset = self.test_dataset
        else:
            raise ValueError("Split must be one of ['train', 'val', 'test']")
        
        return DataLoader(dataset, batch_size=self.batch_size, shuffle=(split == 'train'))

# Example usage of the DatasetManager class

# Instantiate the class
dataset_manager = DatasetManager(dataset_name='MNIST', batch_size=64, val_size=0.1, test_size=0.1)

# Get DataLoaders for training, validation, and test splits
train_loader = dataset_manager.get_dataloader('train')
val_loader = dataset_manager.get_dataloader('val')
test_loader = dataset_manager.get_dataloader('test')

# Example: Print the shape of a batch from the training DataLoader
for images, labels in train_loader:
    print(images.shape)  # Example: [64, 1, 28, 28] for 64 images of size 28x28
    break
