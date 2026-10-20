from flask import Blueprint, jsonify, session

from app.announcements.announcement_service import get_announcements
from app.security.audit_log import record_activity


announcements_bp = Blueprint(
    "announcements",
    __name__
)


@announcements_bp.route(
    "/api/member/announcements",
    methods=["GET"]
)
def member_announcements():

    member_id = session.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    try:

        records = get_announcements()

        record_activity(
            member_id,
            action="Viewed Announcements",
            description="Viewed the TLC announcements.",
            category="announcements",
            details={
                "announcement_count": len(records)
            }
        )

        return jsonify({
            "success": True,
            "announcements": records
        })

    except Exception as error:

        print(
            "[ANNOUNCEMENTS API] ERROR:",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Unable to load announcements."
        }), 500
