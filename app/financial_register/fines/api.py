from flask import Blueprint, jsonify, request, send_from_directory
from pathlib import Path

from app.auth.session import get_current_member_id

from .service import build_fines_register


fines_api = Blueprint(
    "fines_api",
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


@fines_api.get("/api/tlc/fines-register")
def fines_register():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    year = request.args.get("year") or None
    month = request.args.get("month") or None

    try:

        if month and not year:
            return jsonify({
                "success": False,
                "message": "A month requires a year."
            }), 400

        result = build_fines_register(
            year=year,
            month=month,
        )

        return jsonify({
            "success": True,
            "fines": result
        })

    except Exception as exc:

        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500


@fines_api.get("/tlc-fines-register")
def fines_register_page():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    return send_from_directory(
        FRONTEND_DIR / "pages",
        "tlc_fines_register.html"
    )
