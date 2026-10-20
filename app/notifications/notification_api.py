from flask import Blueprint, jsonify
from app.notifications.notification_service import (
    get_notifications,
    get_notification
)


notifications_bp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api/member/notifications"
)


@notifications_bp.route("", methods=["GET"])
def notifications_list():
    return jsonify({
        "success": True,
        "notifications": get_notifications()
    })


@notifications_bp.route("/<notification_id>", methods=["GET"])
def notification_details(notification_id):
    notification = get_notification(notification_id)

    if not notification:
        return jsonify({
            "success": False,
            "message": "Notification not found."
        }), 404

    return jsonify({
        "success": True,
        "notification": notification
    })
