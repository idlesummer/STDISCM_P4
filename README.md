# STDISCM Project

This repository contains a Python gRPC training server that streams metrics while training a simple MNIST model and a Next.js client that visualizes those metrics. Use this guide to install dependencies, generate protobuf bindings, and run both services locally.

## Prerequisites

- **Python 3.13+** with [`uv`](https://docs.astral.sh/uv/) available on your PATH for dependency management.
- **Node.js 18+** (Next.js 16 supports Node 18 LTS and newer) and `npm`.
- **`protoc` compiler** if you need to regenerate protobuf bindings.

## Repository layout

- `backend/`: Python gRPC server, training loop, and sample client scripts.
- `frontend/`: Next.js app that subscribes to the training metrics stream.
- `packages/proto/`: Shared protobuf definitions for the training service.
- `package.json`: Root scripts for regenerating protobuf bindings for both stacks.

## Install dependencies

### Backend (Python)

```bash
cd backend
uv sync
```

This creates a virtual environment and installs the dependencies listed in `pyproject.toml`.

### Frontend (Node.js)

```bash
cd frontend
npm install
```

## Run the services

1. **Start the gRPC training server** (default port `50051`):
   ```bash
   cd backend
   npm run start
   ```
   The server downloads MNIST if needed, trains the model, and streams metrics while running.

2. **Start the Next.js client** (expects the server to be running):
   ```bash
   cd frontend
   npm run dev
   ```
   Open the URL printed by Next.js (defaults to `http://localhost:3000`). The UI connects to `localhost:50051` to display live training metrics.

   A production deployment of the frontend is also available on Vercel at https://stdiscm-p4.vercel.app/dashboard for quick access.

   ## Data export utility (optional)

To export MNIST samples as images for inspection or debugging, run:

```bash
cd backend
npm run export
```

Images are saved under `backend/data/exported/`.
