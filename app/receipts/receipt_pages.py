from flask import Blueprint, send_from_directory

from pathlib import Path


receipt_pages = Blueprint(
    "receipt_pages",
    __name__
)


BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"


@receipt_pages.route("/member/receipts")
def receipts_page():
    return send_from_directory(
        FRONTEND_DIR / "pages",
        "receipts.html"
    )


@receipt_pages.route("/member/receipt/<path:receipt_number>")
def receipt_details_page(receipt_number):
    return send_from_directory(
        FRONTEND_DIR / "pages",
        "member-receipt.html"
    )
