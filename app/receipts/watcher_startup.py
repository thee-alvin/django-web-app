import os

from app.receipts.contribution_watcher import (
    contribution_watcher,
)


def start_contribution_watcher():
    """
    Start the TLC contribution spreadsheet watcher once.
    """

    debug_mode = os.getenv("FLASK_DEBUG", "").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )

    reloader_process = os.getenv(
        "WERKZEUG_RUN_MAIN"
    )

    # With Flask debug reloading, only the actual
    # serving process should start the watcher.
    if debug_mode and reloader_process != "true":
        return

    contribution_watcher.start()
