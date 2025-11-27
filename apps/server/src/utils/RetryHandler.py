from typing import Callable, TypeVar
import time
import grpc


class RetryHandler:
    """Utility for handling retry logic with exponential backoff."""
    T = TypeVar('T')     # Define the type variable at the class level

    def __init__(self, max_retries: int, base_delay: int):
        """Initialize RetryHandler with max retries and base delay."""
        self.max_retries = max_retries
        self.delay = base_delay


    def _backoff(self, attempt: int) -> int:
        """Calculates delay with exponential backoff."""
        return self.delay * (2 ** attempt)


    def execute(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Executes a function with retry logic."""

        for attempt in range(self.max_retries):
            try:
                return func(*args, **kwargs)

            except grpc.RpcError as e:
                print(f"RPC failed (attempt {attempt + 1}/{self.max_retries}): {e}")

                if attempt >= self.max_retries - 1:
                    print("Max retries reached, giving up.")
                    raise  # Reraise the last exception
                else:
                    delay = self._backoff(attempt)
                    print(f"Retrying in {delay} seconds...")
                    time.sleep(delay)

        # This line should never be reached due to the raise in the loop
        raise
