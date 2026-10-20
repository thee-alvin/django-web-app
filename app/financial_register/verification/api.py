from pathlib import Path

from flask import (
    Blueprint,
    jsonify,
    request,
    send_from_directory,
)

from app.auth.session import get_current_member_id
from .service import find_receipt, search_receipts, list_receipt_options


receipt_verification_api = Blueprint(
    "receipt_verification_api",
    __name__
)

BASE_DIR = Path(__file__).resolve().parents[3]

FRONTEND_DIR = (
    BASE_DIR / "frontend"
)

ADMIN_MEMBER_ID = "TLC/001/2026"


def _is_authorized():
    return (
        str(
            get_current_member_id() or ""
        ).strip().upper()
        == ADMIN_MEMBER_ID
    )


@receipt_verification_api.get(
    "/api/tlc/verify-receipt"
)
def verify_receipt():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    receipt_number = str(
        request.args.get(
            "receipt",
            ""
        )
    ).strip()

    if not receipt_number:
        return jsonify({
            "success": False,
            "message": (
                "Receipt number is required."
            )
        }), 400

    try:

        receipt = find_receipt(
            receipt_number
        )

        if receipt is None:
            return jsonify({
                "success": False,
                "message": (
                    "No valid TLC receipt was "
                    "found with that reference."
                )
            }), 404

        return jsonify({
            "success": True,
            "receipt": receipt,
        })

    except FileNotFoundError as error:

        return jsonify({
            "success": False,
            "message": str(error),
        }), 500

    except Exception:

        return jsonify({
            "success": False,
            "message": (
                "Unable to verify the receipt."
            ),
        }), 500


@receipt_verification_api.get("/api/tlc/receipt-options")
def receipt_options_api():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    try:
        results = list_receipt_options()

        return jsonify({
            "success": True,
            "results": results
        })

    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500

@receipt_verification_api.get(
    "/tlc-receipt-verification"
)
def receipt_verification_page():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    return send_from_directory(
        FRONTEND_DIR / "pages",
        "tlc_receipt_verification.html"
    )





