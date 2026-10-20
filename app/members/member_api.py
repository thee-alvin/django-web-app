from flask import Blueprint, jsonify, session

from app.members.member_service import get_member_by_id


member_api = Blueprint(
    "member_api",
    __name__,
    url_prefix="/api"
)


@member_api.route("/member-profile", methods=["GET"])
def member_profile():

    member_id = session.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "No active member session."
        }), 401

    member = get_member_by_id(member_id)

    if not member:
        return jsonify({
            "success": False,
            "message": "Member record could not be found."
        }), 404

    return jsonify({
        "success": True,
        "member": member
    })
