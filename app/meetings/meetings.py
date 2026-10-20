from flask import Blueprint, jsonify, session

from app.meetings.meeting_service import get_member_meetings
from app.security.audit_log import record_activity


meetings_bp = Blueprint(
    "meetings",
    __name__
)


@meetings_bp.route(
    "/api/member/meetings",
    methods=["GET"]
)
def member_meetings():

    member_id = session.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    try:

        meetings = get_member_meetings()

        record_activity(
            member_id,
            action="Viewed Meetings",
            description="Viewed the TLC meetings.",
            category="meetings",
            details={
                "meeting_count": len(meetings)
            }
        )

        return jsonify({
            "success": True,
            "member_id": member_id,
            "meetings": meetings
        })

    except Exception as error:

        print(
            "[MEETINGS API] ERROR:",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Unable to load meetings."
        }), 500
