from flask import Blueprint, jsonify, session

from .payment_service import (
    get_member_contributions,
    get_member_contribution_summary,
)


contributions_bp = Blueprint(
    "contributions",
    __name__,
)


@contributions_bp.get("/api/member/contributions")
def member_contributions():
    member_id = session.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "You must be logged in.",
        }), 401

    try:
        contributions = get_member_contributions(
            member_id
        )

        summary = get_member_contribution_summary(
            member_id
        )

        return jsonify({
            "success": True,
            "member_id": member_id,
            "summary": summary,
            "contributions": contributions,
        })

    except FileNotFoundError:
        return jsonify({
            "success": False,
            "message": "Contribution records are unavailable.",
        }), 500

    except Exception:
        return jsonify({
            "success": False,
            "message": "Unable to load your contributions.",
        }), 500
