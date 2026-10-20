from flask import Blueprint, jsonify, session

from app.receipts.receipt_storage import get_receipts_for_member
from app.security.audit_log import record_activity


member_receipts_api = Blueprint(
    "member_receipts_api",
    __name__,
    url_prefix="/api/member/receipts"
)


@member_receipts_api.route(
    "",
    methods=["GET"]
)
def get_member_receipts():

    member_id = session.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Please log in to view your receipts."
        }), 401

    receipts = get_receipts_for_member(
        member_id
    )

    record_activity(
        member_id,
        action="Viewed Receipts",
        description="Viewed personal TLC payment receipts.",
        category="receipts",
        details={
            "receipt_count": len(receipts)
        }
    )

    return jsonify({
        "success": True,
        "receipts": receipts
    })
