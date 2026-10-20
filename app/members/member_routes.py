from flask import Blueprint, send_from_directory

from pathlib import Path


member_routes = Blueprint(
    "member_routes",
    __name__
)


BASE_DIR = Path(__file__).resolve().parents[2]

MEMBER_PAGES = (
    BASE_DIR
    / "frontend"
    / "pages"
    / "member"
)


@member_routes.route("/member/profile")
def profile():
    return send_from_directory(
        MEMBER_PAGES,
        "profile.html"
    )


@member_routes.route("/member/contributions")
def contributions():
    return send_from_directory(
        MEMBER_PAGES,
        "contributions.html"
    )


@member_routes.route("/member/receipts")
def receipts():
    return send_from_directory(
        MEMBER_PAGES,
        "receipts.html"
    )


@member_routes.route("/member/welfare")
def welfare():
    return send_from_directory(
        MEMBER_PAGES,
        "welfare.html"
    )


@member_routes.route("/member/meetings")
def meetings():
    return send_from_directory(
        MEMBER_PAGES,
        "meetings.html"
    )


@member_routes.route("/member/announcements")
def announcements():
    return send_from_directory(
        MEMBER_PAGES,
        "announcements.html"
    )


@member_routes.route("/member/documents")
def documents():
    return send_from_directory(
        MEMBER_PAGES,
        "documents.html"
    )


@member_routes.route("/member/elections")
def elections():
    return send_from_directory(
        MEMBER_PAGES,
        "elections.html"
    )


@member_routes.route("/member/notifications")
def notifications():
    return send_from_directory(
        MEMBER_PAGES,
        "notifications.html"
    )


@member_routes.route("/member/financial-summary")
def financial_summary():
    return send_from_directory(
        MEMBER_PAGES,
        "financial_summary.html"
    )
@member_routes.route("/member/activity")
def activity():
    return send_from_directory(
        MEMBER_PAGES,
        "activity.html"
    )


@member_routes.route("/member/payment-statements")
def payment_statements():
    return send_from_directory(
        MEMBER_PAGES,
        "payment-statements.html"
    )

