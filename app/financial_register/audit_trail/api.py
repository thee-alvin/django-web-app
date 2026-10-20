from flask import Blueprint, jsonify, request, send_from_directory
from pathlib import Path

from app.auth.session import get_current_member_id

from .service import build_financial_audit_trail, clear_financial_audit_trail


financial_audit_api = Blueprint(
    "financial_audit_api",
    __name__
)


ADMIN_MEMBER_ID = "TLC/001/2026"

BASE_DIR = Path(__file__).resolve().parents[3]

FRONTEND_DIR = BASE_DIR / "frontend"


def _is_authorized():

    return (
        str(
            get_current_member_id() or ""
        ).strip().upper()
        == ADMIN_MEMBER_ID
    )



@financial_audit_api.get(
    "/api/tlc/financial-audit-trail"
)
def financial_audit_trail():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    try:

        limit = request.args.get(
            "limit",
            default=200,
            type=int
        )

        result = build_financial_audit_trail(
            limit=limit
        )

        return jsonify({
            "success": True,
            "audit": result
        })

    except Exception as exc:

        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500



@financial_audit_api.post(
    "/api/tlc/financial-audit-trail/reset"
)
def reset_financial_audit_trail():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    try:

        result = clear_financial_audit_trail()

        return jsonify(result)

    except Exception as exc:

        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500

@financial_audit_api.get(
    "/tlc-financial-audit-trail"
)
def financial_audit_trail_page():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    return send_from_directory(
        FRONTEND_DIR / "pages",
        "tlc_financial_audit_trail.html"
    )


