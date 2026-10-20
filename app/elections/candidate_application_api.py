from flask import Blueprint, jsonify, request, session

from app.security.audit_log import record_activity

from app.elections.candidate_application_service import (
    submit_candidate_application
)


candidate_application_bp = Blueprint(
    "candidate_application",
    __name__
)


@candidate_application_bp.route(
    "/api/member/elections/candidate-application",
    methods=["POST"]
)
def submit_application():

    member_id = str(
        session.get("member_id") or ""
    ).strip()

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    data = request.get_json(
        silent=True
    ) or {}

    try:

        success, message, candidate_id = (
            submit_candidate_application(
                member_id=member_id,
                full_name=str(
                    data.get("full_name") or ""
                ).strip(),
                position_id=str(
                    data.get("position_id") or ""
                ).strip(),
                manifesto=str(
                    data.get("manifesto") or ""
                ).strip()
            )
        )

        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 400

        record_activity(
            member_id,
            action="Candidate Application Submitted",
            description=(
                "Your TLC election candidate application "
                "was submitted successfully."
            ),
            category="election",
            details={
                "candidate_id": candidate_id,
                "position_id": str(
                    data.get("position_id") or ""
                ).strip()
            }
        )

        return jsonify({
            "success": True,
            "message": message,
            "candidate_id": candidate_id
        })

    except Exception as error:

        print(
            "[CANDIDATE APPLICATION] ERROR:",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Unable to submit candidate application."
        }), 500

