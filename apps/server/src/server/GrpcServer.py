from   concurrent import futures
import grpc
import logging
from   typing import TypeVar
from   src.types.Servicer import Servicer


# Set up logging for this module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GrpcServer:
    """Higher-level abstraction for running a gRPC server."""

    def __init__(self, port: str, servicers: list[Servicer]):
        """Initialize the gRPC server with a given port and services."""
        self.port = port
        self.servicers = servicers
        self.server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))


    def add_servicers(self) -> None:
        """Add the provided servicers to the server."""
        for servicer in self.servicers:
            servicer_name = servicer.__class__.__name__
            try:
                # Add the servicer dynamically
                servicer.add_to_server(self.server)
                logger.info(f"Servicer {servicer_name} added to the server.")
            except grpc.RpcError as e:
                logger.error(f"RPC Error while adding servicer {servicer_name}: {e}")
            except Exception as e:
                logger.error(f"Failed to add servicer {servicer_name}: {e}")


    def start(self) -> None:
        """Start the gRPC server."""
        self.add_servicers()
        self.server.add_insecure_port(f"[::]:{self.port}")
        self.server.start()
        logger.info(f"Server started on port {self.port}")


    def wait_for_termination(self) -> None:
        """Block until the server is stopped."""
        try:
            self.server.wait_for_termination()
        except KeyboardInterrupt:
            logger.info("\nShutting down server...")
            self.server.stop(0)


    def stop(self) -> None:
        """Stop the gRPC server."""
        self.server.stop(0)
        logger.info("Server stopped.")
