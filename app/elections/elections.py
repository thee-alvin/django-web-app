
from flask import Blueprint, jsonify, session

from app.elections.election_service import get_election_overview


elections_bp = Blueprint(
    "elections",
    __name__
)


@elections_bp.route(
    "/api/member/elections",
    methods=["GET"]
)
def member_elections():

    if not session.get("member_id"):
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    try:
        overview = get_election_overview()

        return jsonify({
            "success": True,
            **overview
        })

    except Exception as error:

        print(
            "[ELECTIONS API] ERROR:",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Unable to load election information."
        }), 500
