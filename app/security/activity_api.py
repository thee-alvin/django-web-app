from pathlib import Path

from flask import (
    Blueprint,
    jsonify,
    send_from_directory
)

from app.auth.session import get_current_member_id
from app.security.audit_log import get_member_activity


activity_api = Blueprint(
    "activity_api",
    __name__
)

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"


@activity_api.get("/api/member/activity")
def member_activity():

    member_id = get_current_member_id()

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    activities = get_member_activity(
        member_id,
        limit=100
    )

    return jsonify({
        "success": True,
        "activities": activities
    })


@activity_api.get("/member/activity")
def member_activity_page():

    if not get_current_member_id():
        return send_from_directory(
            FRONTEND_DIR / "pages",
            "login.html"
        )

    return send_from_directory(
        FRONTEND_DIR / "pages" / "member",
        "activity.html"
    )
