"""Export MNIST train images as PNG files."""

import os
from pathlib import Path
from torchvision import datasets
from PIL import Image


def export_mnist_images():
    """Export all MNIST train images to backend/images/train/ directory."""

    # Set up paths
    script_dir = Path(__file__).parent
    backend_dir = script_dir.parent
    data_dir = backend_dir / 'data'
    images_dir = backend_dir / 'images' / 'train'

    # Create images directory
    images_dir.mkdir(parents=True, exist_ok=True)

    print(f"📂 Loading MNIST train dataset from {data_dir}...")

    # Load MNIST train dataset (no transforms, just raw PIL images)
    train_dataset = datasets.MNIST(
        root=str(data_dir),
        train=True,
        download=True,
        transform=None  # Get raw PIL images
    )

    print(f"💾 Exporting {len(train_dataset)} train images to {images_dir}...")

    # Export each image
    for idx, (img, label) in enumerate(train_dataset):
        # Save as PNG
        img.save(images_dir / f"{idx}.png")

        # Progress update every 5000 images
        if (idx + 1) % 5000 == 0:
            print(f"   Exported {idx + 1}/{len(train_dataset)} images...")

    print(f"✅ Successfully exported {len(train_dataset)} images!")
    print(f"   Location: {images_dir}")

    # Print some stats
    total_size = sum(f.stat().st_size for f in images_dir.glob('*.png'))
    avg_size = total_size / len(train_dataset)
    print(f"   Total size: {total_size / 1024 / 1024:.2f} MB")
    print(f"   Average size per image: {avg_size / 1024:.2f} KB")


if __name__ == '__main__':
    export_mnist_images()
