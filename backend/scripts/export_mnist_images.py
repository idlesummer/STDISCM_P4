"""Export MNIST test images as PNG files."""

import os
from pathlib import Path
from torchvision import datasets
from PIL import Image


def export_mnist_images():
    """Export all MNIST test images to backend/images/test/ directory."""

    # Set up paths
    script_dir = Path(__file__).parent
    backend_dir = script_dir.parent
    data_dir = backend_dir / 'data'
    images_dir = backend_dir / 'images' / 'test'

    # Create images directory
    images_dir.mkdir(parents=True, exist_ok=True)

    print(f"📂 Loading MNIST test dataset from {data_dir}...")

    # Load MNIST test dataset (no transforms, just raw PIL images)
    test_dataset = datasets.MNIST(
        root=str(data_dir),
        train=False,
        download=True,
        transform=None  # Get raw PIL images
    )

    print(f"💾 Exporting {len(test_dataset)} test images to {images_dir}...")

    # Export each image
    for idx, (img, label) in enumerate(test_dataset):
        # Save as PNG
        img.save(images_dir / f"{idx}.png")

        # Progress update every 1000 images
        if (idx + 1) % 1000 == 0:
            print(f"   Exported {idx + 1}/{len(test_dataset)} images...")

    print(f"✅ Successfully exported {len(test_dataset)} images!")
    print(f"   Location: {images_dir}")

    # Print some stats
    total_size = sum(f.stat().st_size for f in images_dir.glob('*.png'))
    avg_size = total_size / len(test_dataset)
    print(f"   Total size: {total_size / 1024 / 1024:.2f} MB")
    print(f"   Average size per image: {avg_size / 1024:.2f} KB")


if __name__ == '__main__':
    export_mnist_images()
