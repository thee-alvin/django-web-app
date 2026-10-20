import threading
import time

from app.receipts.contribution_processor import (
    process_pending_contributions
)

CHECK_INTERVAL = 1


class ContributionWatcher:

    def __init__(self):
        self._stop_event = threading.Event()
        self._thread = None

    def start(self):

        if self._thread and self._thread.is_alive():
            return

        self._stop_event.clear()

        self._thread = threading.Thread(
            target=self._run,
            name="TLC-Contribution-Watcher",
            daemon=True
        )

        self._thread.start()

        print(
            "[TLC WATCHER] Started. Checking 02_CONTRIBUTIONS.xlsx every 1 second.",
            flush=True
        )

    def stop(self):

        self._stop_event.set()

        if self._thread:
            self._thread.join(timeout=3)

    def _run(self):

        while not self._stop_event.is_set():

            try:

                print(
                    "[TLC WATCHER] Checking spreadsheet...",
                    flush=True
                )

                results = process_pending_contributions()

                if results:

                    for result in results:

                        print(
                            "[TLC WATCHER] PROCESSED:",
                            result,
                            flush=True
                        )

                else:

                    print(
                        "[TLC WATCHER] No PENDING payment found.",
                        flush=True
                    )

            except Exception as error:

                print(
                    "[TLC WATCHER] ERROR:",
                    repr(error),
                    flush=True
                )

            self._stop_event.wait(
                CHECK_INTERVAL
            )


contribution_watcher = ContributionWatcher()
