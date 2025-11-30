import torch
import threading
from torch import nn
from torch.optim import SGD  # Tutorial uses SGD
from collections import defaultdict

from src.model.DataModule import DataModule
from src.model.Model import Model
from src.model.Trainer import Trainer



def metric_consumer(trainer):
    """Consume and log metrics in real-time."""
    
    while metric := trainer.metrics.get():
        # Print metric with nice formatting
        print(f"{metric}")


if __name__ == '__main__':
    # Setup data
    data = DataModule(batch_size=16)  # Tutorial uses batch_size=5
    train_loader, test_loader = data.get_loaders()

    # Setup model (using tutorial's architecture)
    model = Model()
    
    criterion = nn.CrossEntropyLoss()
    optimizer = SGD(model.parameters(), lr=0.01)  # Tutorial uses SGD with lr=0.01
    trainer = Trainer(model, criterion, optimizer, train_loader, tolerance=0.01, update_interval=160)

    # Start consumer thread
    consumer_thread = threading.Thread(target=metric_consumer, args=(trainer,), daemon=True)
    consumer_thread.start()

    # Train (consumer processes metrics in parallel)
    trainer.train(num_epochs=2)  # Tutorial uses 20 epochs

    # Signal consumer to stop
    trainer.metrics.put(None)
    consumer_thread.join()

    print(f"\nTraining converged: {trainer.converged}")
    
    # Optional: Test evaluation
    model.eval()
    with torch.no_grad():
        correct = 0
        total = 0
        for images, labels in test_loader:
            outputs = model(images)
            preds = outputs.argmax(dim=-1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
        
        print(f"Test Accuracy: {100 * correct / total:.2f}%")
