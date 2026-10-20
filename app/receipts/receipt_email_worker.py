import threading

from openpyxl import load_workbook

from app.receipts.email_queue import (
    get_next_email_job,
    remove_email_job,
)

from app.receipts.receipt_pdf_generator import (
    generate_receipt_pdf,
)

from app.services.email_service import (
    send_receipt_email,
)


class ReceiptEmailWorker:

    def __init__(self):

        self._stop_event = threading.Event()
        self._thread = None

    def start(self):

        if (
            self._thread
            and self._thread.is_alive()
        ):
            return

        self._stop_event.clear()

        self._thread = threading.Thread(
            target=self._run,
            name="TLC-Receipt-Email-Worker",
            daemon=True,
        )

        self._thread.start()

        print(
            "[TLC EMAIL WORKER] Started.",
            flush=True,
        )

    def stop(self):

        self._stop_event.set()

        if self._thread:

            self._thread.join(
                timeout=3
            )

    def _run(self):

        while not self._stop_event.is_set():

            try:

                job = get_next_email_job()

                if not job:

                    self._stop_event.wait(1)

                    continue

                receipt = job["receipt"]

                print(
                    "[TLC EMAIL WORKER] Sending:",
                    receipt.get("receipt_number"),
                    flush=True,
                )

                pdf_bytes = (
                    generate_receipt_pdf(
                        receipt
                    )
                )

                success, message = (
                    send_receipt_email(
                        recipient_email=job[
                            "recipient_email"
                        ],
                        receipt_number=receipt[
                            "receipt_number"
                        ],
                        member_name=receipt[
                            "member_name"
                        ],
                        amount=receipt[
                            "amount"
                        ],
                        pdf_bytes=pdf_bytes,
                    )
                )

                if success:

                    remove_email_job(
                        receipt[
                            "receipt_number"
                        ]
                    )

                    print(
                        "[TLC EMAIL WORKER] SENT:",
                        receipt[
                            "receipt_number"
                        ],
                        flush=True,
                    )

                else:

                    print(
                        "[TLC EMAIL WORKER] FAILED:",
                        message,
                        flush=True,
                    )

                    self._stop_event.wait(10)

            except Exception as error:

                print(
                    "[TLC EMAIL WORKER] ERROR:",
                    repr(error),
                    flush=True,
                )

                self._stop_event.wait(10)


receipt_email_worker = ReceiptEmailWorker()
