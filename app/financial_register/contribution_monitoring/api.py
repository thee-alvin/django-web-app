from flask import Blueprint, jsonify, request, send_from_directory
from pathlib import Path

from app.auth.session import get_current_member_id

from .service import build_contribution_monitoring


contribution_monitoring_api = Blueprint(
    "contribution_monitoring_api",
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


@contribution_monitoring_api.get(
    "/api/tlc/contribution-monitoring"
)
def contribution_monitoring():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    try:

        weeks = request.args.get(
            "weeks",
            default=8,
            type=int
        )

        weeks = max(
            1,
            min(12, weeks)
        )

        result = build_contribution_monitoring(
            history_weeks=weeks
        )

        return jsonify({
            "success": True,
            "monitoring": result
        })

    except Exception as exc:

        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500


@contribution_monitoring_api.get(
    "/tlc-contribution-monitoring"
)
def contribution_monitoring_page():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    return send_from_directory(
        FRONTEND_DIR / "pages",
        "tlc_contribution_monitoring.html"
    )
