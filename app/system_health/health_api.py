from flask import Blueprint, jsonify

from app.auth.session import get_current_member_id
from app.system_health.health_service import get_system_health


system_health_api = Blueprint(
    "system_health_api",
    __name__,
)

ADMIN_MEMBER_ID = "TLC/001/2026"


def _is_admin():
    return (
        str(get_current_member_id() or "").strip().upper()
        == ADMIN_MEMBER_ID
    )


@system_health_api.get("/api/tlc/health")
def system_health():
    if not _is_admin():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    response = jsonify(get_system_health())
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    return response

