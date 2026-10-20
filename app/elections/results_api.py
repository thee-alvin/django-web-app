from flask import Blueprint, jsonify, session

from app.elections.election_control import get_election
from app.elections.results_service import calculate_results


results_bp = Blueprint(
    "election_results",
    __name__
)


@results_bp.route(
    "/api/member/elections/results",
    methods=["GET"]
)
def member_election_results():

    if not session.get("member_id"):
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    try:
        election = get_election()

        if not election:
            return jsonify({
                "success": False,
                "message": "No election is configured."
            }), 404

        results_status = str(
            election.get("Results Status") or ""
        ).strip().upper()

        if results_status not in ("READY", "PUBLISHED"):
            return jsonify({
                "success": True,
                "results_available": False,
                "message": "Election results are not yet available.",
                "results": []
            })

        results = calculate_results(
            election.get("Election ID")
        )

        return jsonify({
            "success": True,
            "results_available": True,
            "results_status": results_status,
            "results": results
        })

    except Exception as error:
        print(
            "[ELECTION RESULTS API] ERROR:",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Unable to load election results."
        }), 500
