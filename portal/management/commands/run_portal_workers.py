import logging
import time

from django.core.management.base import BaseCommand


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run TLC spreadsheet watchers and email queue workers."

    def handle(self, *args, **options):
        from app.announcements.announcement_watcher import announcement_watcher
        from app.meetings.meeting_watcher import meeting_watcher
        from app.payments.weekly_contribution_watcher import (
            weekly_contribution_watcher,
        )
        from app.receipts.contribution_watcher import contribution_watcher
        from app.receipts.receipt_email_worker import receipt_email_worker

        workers = (
            contribution_watcher,
            receipt_email_worker,
            announcement_watcher,
            meeting_watcher,
            weekly_contribution_watcher,
        )

        for worker in workers:
            worker.start()
            logger.info("Started background worker %s", worker.__class__.__name__)

        self.stdout.write(self.style.SUCCESS("TLC background workers are running."))
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Stopping TLC background workers.")
        finally:
            for worker in reversed(workers):
                worker.stop()
