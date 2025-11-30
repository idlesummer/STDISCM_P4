from typing import Any, Callable, Self
from queue import Queue
from threading import Thread


class QueueConsumer(Thread):
    """Background thread that consumes items from a Queue and processes them via a handler."""
    
    queue: Queue                        # queue to read items from
    handler: Callable[[Any], None]      # function invoked for each item

    def __init__(self, queue: Queue, handler: Callable[[Any], None]) -> None:
        super().__init__(daemon=True)   # daemon thread exits with main program
        self.queue = queue              
        self.handler = handler          
        self._sentinel = object()       # unique stop signal (never equals real items)

    def run(self) -> None:
        """Main thread loop: block on queue and handle each item."""
        while True:
            item = self.queue.get()     # waits (blocking) until an item is available
            if item is self._sentinel:  # sentinel signals clean shutdown
                break
            self.handler(item)          # process item with provided handler

    def __enter__(self) -> Self:
        """Start the consumer thread when entering a `with` block."""
        self.start()                    # begin background thread execution
        return self                     # allow use inside the `with` context

    def __exit__(self, exc_type, exc, tb) -> None:
        """Stop the thread cleanly when leaving the `with` block."""
        self.queue.put(self._sentinel)  # wake thread and signal it to exit
        self.join()                     # wait until the thread finishes
