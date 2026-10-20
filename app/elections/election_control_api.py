from datetime import datetime

from flask import Blueprint, jsonify, session

from app.elections.election_control import (
    get_election,
    close_election
)

election_control_bp = Blueprint(
    "election_control",
    __name__
)


@election_control_bp.route(
    "/api/member/elections/status",
    methods=["GET"]
)
def election_status():

    if not session.get("member_id"):
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    election = get_election()

    if not election:
        return jsonify({
            "success": False,
            "message": "No election is configured."
        }), 404

    voting_end = election.get("Voting End")
    status = str(election.get("Status") or "").strip()

    expired = False

    if hasattr(voting_end, "timestamp"):
        expired = datetime.now() >= voting_end

    if expired and status.upper() == "VOTING OPEN":
        try:
            outcome = close_election(
                election.get("Election ID")
            )
            election = get_election()

            return jsonify({
                "success": True,
                "status": election.get("Status"),
                "results_status": election.get("Results Status"),
                "closed_automatically": True,
                "results": outcome.get("results", [])
            })

        except Exception as error:
            print(
                "[ELECTION CONTROL] ERROR:",
                repr(error),
                flush=True
            )

            return jsonify({
                "success": False,
                "message": "Unable to close expired election."
            }), 500

    return jsonify({
        "success": True,
        "status": status,
        "results_status": election.get("Results Status"),
        "closed_automatically": False
    })


@election_control_bp.route(
    "/api/admin/elections/close",
    methods=["POST"]
)
def admin_close_election():

    if not session.get("member_id"):
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    try:
        outcome = close_election()

        return jsonify(outcome)

    except Exception as error:
        print(
            "[ELECTION CONTROL] ERROR:",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": str(error)
        }), 400
