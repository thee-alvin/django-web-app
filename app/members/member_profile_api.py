from flask import Blueprint, jsonify, session

from app.members.member_service import get_member_by_id


member_profile_api = Blueprint(
    "member_profile_api",
    __name__,
    url_prefix="/api/member/profile"
)


@member_profile_api.route("", methods=["GET"])
def get_profile():

    member_id = session.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Please log in to view your profile."
        }), 401

    member = get_member_by_id(
        member_id
    )

    if not member:
        return jsonify({
            "success": False,
            "message": "Your TLC member record could not be found."
        }), 404

    return jsonify({
        "success": True,
        "member": member
    })
