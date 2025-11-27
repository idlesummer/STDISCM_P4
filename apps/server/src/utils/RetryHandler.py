from typing import Callable, TypeVar
import logging
import time
import grpc


# Set up logging for this module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define a global TypeVar
T = TypeVar('T')


class RetryHandler:
    """Utility for handling retry logic with exponential backoff."""

    def __init__(self, max_retries: int, delay: int):
        """Initialize RetryHandler with max retries and base delay."""
        self.max_retries = max_retries
        self.delay = delay


    def execute(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Executes a function with retry logic."""
        
        # Store the last exception encountered  
        last_exception = None          
        
        # Attempt to execute the function up to 'max_retries' times.
        for attempt in range(self.max_retries):
            try:
                return func(*args, **kwargs)

            except grpc.RpcError as e:
                last_exception = e  # Store the exception
                
                # Calculate exponential backoff delay
                delay = self.delay * (2 ** attempt)
                logger.warning(f"RPC failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)

        # After all retries are exhausted, raise the last encountered exception
        logger.error("Max retries reached, giving up.")
        exception = RuntimeError("Unexpected error: No exception was raised.")
        raise last_exception or exception
