from typing import Protocol
import grpc


class Servicer(Protocol):
    """Protocol defining the expected interface for a gRPC servicer."""

    def add_to_server(self, server: grpc.Server) -> None:
        """Method to add the servicer to the gRPC server."""
        ...
