from pathlib import Path
import os
import time


BASE_DIR = Path(__file__).resolve().parents[2]

LOCK_FILE = (
    BASE_DIR
    / "data"
    / "receipts"
    / ".contribution_processor.lock"
)

STALE_LOCK_SECONDS = 300


class ContributionProcessLock:

    def __init__(self):
        self.lock_acquired = False

    def acquire(self):
        LOCK_FILE.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        try:
            fd = os.open(
                str(LOCK_FILE),
                os.O_CREAT
                | os.O_EXCL
                | os.O_WRONLY
            )

            os.close(fd)

            self.lock_acquired = True
            return True

        except FileExistsError:
            try:
                age = time.time() - LOCK_FILE.stat().st_mtime

                if age > STALE_LOCK_SECONDS:
                    LOCK_FILE.unlink(missing_ok=True)

                    fd = os.open(
                        str(LOCK_FILE),
                        os.O_CREAT
                        | os.O_EXCL
                        | os.O_WRONLY
                    )

                    os.close(fd)

                    self.lock_acquired = True
                    return True

            except (FileNotFoundError, OSError):
                pass

            return False

    def release(self):
        if not self.lock_acquired:
            return

        try:
            LOCK_FILE.unlink(
                missing_ok=True
            )
        except OSError:
            pass

        self.lock_acquired = False


def process_lock():
    return ContributionProcessLock()
