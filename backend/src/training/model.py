from torch import Tensor
import torch.nn as nn


# Regular NN Verson

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


# # CNN Version

# import torch.nn as nn
# from torch import Tensor

# class Model(nn.Module):
#     """
#     Simple CNN for 28x28 grayscale images.
#     Feature extractor: Conv -> ReLU -> Conv -> ReLU -> MaxPool (twice)
#     Classifier: Linear -> ReLU -> Linear (logits for 10 classes)
#     """
    
#     features: nn.Sequential
#     classifier: nn.Sequential
    
#     def __init__(self, num_classes: int = 10) -> None:
#         super().__init__()
#         self.features = nn.Sequential(
#             nn.Conv2d(in_channels=1, out_channels=32, kernel_size=3, padding=1),    # 1x28x28 -> 32x28x28
#             nn.ReLU(inplace=True),                                                  # Saves memory
#             nn.Conv2d(32, 64, kernel_size=3, padding=1),                            # 32x28x28 -> 64x28x28
#             nn.ReLU(inplace=True),
#             nn.MaxPool2d(2),                                                        # 64x28x28 -> 64x14x14

#             nn.Conv2d(64, 128, kernel_size=3, padding=1),                           # 64x14x14 -> 128x14x14
#             nn.ReLU(inplace=True),
#             nn.MaxPool2d(2),                                                        # 128x14x14 -> 128x7x7
#         )
#         # 128 channels * 7 * 7 = 6272 features after the second pool
#         self.classifier = nn.Sequential(
#             nn.Flatten(),                  # -> (N, 6272)
#             nn.Linear(128 * 7 * 7, 256),
#             nn.ReLU(inplace=True),
#             nn.Linear(256, num_classes),   # logits
#         )

#     def forward(self, x: Tensor) -> Tensor:
#         # Expect x of shape (N, 1, 28, 28) with dtype float
#         x = self.features(x)
#         x = self.classifier(x)

#         # Do NOT squeeze; keep batch dim even for N=1
#         return x  #
