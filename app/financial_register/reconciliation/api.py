from flask import Blueprint, jsonify, send_from_directory
from pathlib import Path

from app.auth.session import get_current_member_id

from .service import build_reconciliation


reconciliation_api = Blueprint(
    "reconciliation_api",
    __name__
)


ADMIN_MEMBER_ID = "TLC/001/2026"

BASE_DIR = Path(__file__).resolve().parents[3]

FRONTEND_DIR = BASE_DIR / "frontend"


def _is_authorized():
    return (
        str(get_current_member_id() or "").strip().upper()
        == ADMIN_MEMBER_ID
    )


@reconciliation_api.get(
    "/api/tlc/financial-reconciliation"
)
def financial_reconciliation():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    try:

        result = build_reconciliation()

        return jsonify({
            "success": True,
            "reconciliation": result
        })

    except Exception as exc:

        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500

@reconciliation_api.get(
    "/tlc-financial-reconciliation"
)
def financial_reconciliation_page():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    return send_from_directory(
        FRONTEND_DIR / "pages",
        "tlc_financial_reconciliation.html"
    )


