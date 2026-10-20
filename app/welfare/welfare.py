from flask import Blueprint, jsonify, session

from .welfare_service import (
    get_member_welfare,
    get_member_welfare_summary,
)


welfare_bp = Blueprint(
    "welfare",
    __name__,
)


@welfare_bp.get("/api/member/welfare")
def member_welfare():

    member_id = session.get(
        "member_id"
    )

    if not member_id:
        return jsonify({
            "success": False,
            "message": "You must be logged in.",
        }), 401

    try:

        welfare = get_member_welfare(
            member_id
        )

        summary = get_member_welfare_summary(
            member_id
        )

        return jsonify({
            "success": True,
            "member_id": member_id,
            "summary": summary,
            "welfare": welfare,
        })

    except FileNotFoundError:

        return jsonify({
            "success": False,
            "message": "Welfare records are unavailable.",
        }), 500

    except Exception:

        return jsonify({
            "success": False,
            "message": "Unable to load your welfare information.",
        }), 500
