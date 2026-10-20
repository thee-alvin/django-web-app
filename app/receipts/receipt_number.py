from datetime import datetime


RECEIPT_PREFIX = "TLC/RCPT"


def format_receipt_number(sequence, year=None):
    """
    Create a standardized TLC receipt number.

    Example:
        TLC/RCPT/2026/000001
    """

    if year is None:
        year = datetime.now().year

    sequence = int(sequence)

    if sequence < 1:
        raise ValueError("Receipt sequence must be greater than zero.")

    return f"{RECEIPT_PREFIX}/{year}/{sequence:06d}"
