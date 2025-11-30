from torch import Tensor
import torch.nn as nn


class Model(nn.Module):
    """Neural network pipeline from https://www.youtube.com/watch?v=gBw0u_5u0qU."""
    
    fc1: nn.Linear     # fully connected: 784 → 100
    fc2: nn.Linear     # fully connected: 100 → 50
    fc3: nn.Linear     # fully connected: 50 → 10 (logits)
    relu: nn.ReLU      # ReLU non-linearity
    
    
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(28**2, 100)   # first linear layer
        self.fc2 = nn.Linear(100, 50)      # second linear layer
        self.fc3 = nn.Linear(50, 10)       # output layer (10 classes)
        self.relu = nn.ReLU()              # activation function
    
    
    def forward(self, x: Tensor) -> Tensor:
        x = x.view(-1, 28**2)              # flatten 28×28 → 784
        x = self.relu(self.fc1(x))         # apply layer 1 + ReLU
        x = self.relu(self.fc2(x))         # apply layer 2 + ReLU
        x = self.fc3(x)                    # final linear layer (logits)
        return x.squeeze()                 # remove dims of size 1
