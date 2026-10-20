from pathlib import Path
import json
import threading
import time
from app.config.data_paths import DATA_DIR


BASE_DIR = Path(__file__).resolve().parents[2]

QUEUE_DIR = (
    DATA_DIR
    / "receipts"
    / "email_queue"
)

QUEUE_FILE = QUEUE_DIR / "pending_emails.json"

_queue_lock = threading.Lock()


def ensure_queue():
    QUEUE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    if not QUEUE_FILE.exists():
        QUEUE_FILE.write_text(
            "[]",
            encoding="utf-8"
        )


def load_queue():
    ensure_queue()

    try:
        data = json.loads(
            QUEUE_FILE.read_text(
                encoding="utf-8"
            )
        )

        return data if isinstance(data, list) else []

    except (json.JSONDecodeError, OSError):
        return []


def save_queue(items):
    ensure_queue()

    QUEUE_FILE.write_text(
        json.dumps(
            items,
            indent=4,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )


def enqueue_email(job):
    """
    Add one email job to the persistent queue.
    """

    with _queue_lock:

        queue = load_queue()

        receipt_number = str(
            job.get("receipt_number", "")
        ).strip()

        # Prevent the same receipt from being queued twice.
        for existing in queue:

            if str(
                existing.get("receipt_number", "")
            ).strip() == receipt_number:

                return False

        queue.append(job)

        save_queue(queue)

        return True


def get_next_email_job():
    with _queue_lock:

        queue = load_queue()

        if not queue:
            return None

        job = queue[0]

        return job


def remove_email_job(receipt_number):
    with _queue_lock:

        queue = load_queue()

        queue = [
            job
            for job in queue
            if str(
                job.get("receipt_number", "")
            ).strip()
            != str(receipt_number).strip()
        ]

        save_queue(queue)
