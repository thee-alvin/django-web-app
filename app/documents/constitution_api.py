from flask import Blueprint, jsonify, send_file
from app.auth.session import get_current_member_id
from app.security.audit_log import record_activity
from app.documents.constitution_service import (
    get_constitution_text,
    CONSTITUTION_PDF
)

constitution_bp = Blueprint(
    "constitution",
    __name__,
    url_prefix="/api/member/constitution"
)


@constitution_bp.route("", methods=["GET"])
def constitution_info():
    text = get_constitution_text()

    if not text:
        return jsonify({
            "success": False,
            "message": "TLC Constitution is currently unavailable."
        }), 404

    return jsonify({
        "success": True,
        "name": "TLC Constitution",
        "title": "THE LEGACY CIRCLE",
        "subtitle": "OFFICIAL CONSTITUTION",
        "motto": "United in Purpose. Built to Last.",
        "founding_date": "1 September 2026"
    })


@constitution_bp.route("/text", methods=["GET"])
def constitution_text():
    text = get_constitution_text()

    if not text:
        return jsonify({
            "success": False,
            "message": "TLC Constitution is currently unavailable."
        }), 404

    return jsonify({
        "success": True,
        "text": text
    })


@constitution_bp.route("/download", methods=["GET"])
def download_constitution():
    if not CONSTITUTION_PDF.exists():
        return jsonify({
            "success": False,
            "message": "Official Constitution PDF not found."
        }), 404

    member_id = get_current_member_id()

    if member_id:
        record_activity(
            member_id,
            action="Constitution Downloaded",
            description="Downloaded the official TLC Constitution.",
            category="document",
            details={
                "document": "THE_LEGACY_CIRCLE_OFFICIAL_CONSTITUTION.pdf"
            }
        )

    return send_file(
        CONSTITUTION_PDF,
        as_attachment=True,
        download_name="THE_LEGACY_CIRCLE_OFFICIAL_CONSTITUTION.pdf",
        mimetype="application/pdf"
    )


@constitution_bp.route("/print", methods=["GET"])
def print_constitution():
    if not CONSTITUTION_PDF.exists():
        return jsonify({
            "success": False,
            "message": "Official Constitution PDF not found."
        }), 404

    member_id = get_current_member_id()

    if member_id:
        record_activity(
            member_id,
            action="Constitution Opened",
            description="Opened the official TLC Constitution for viewing or printing.",
            category="document",
            details={
                "document": "THE_LEGACY_CIRCLE_OFFICIAL_CONSTITUTION.pdf"
            }
        )

    return send_file(
        CONSTITUTION_PDF,
        as_attachment=False,
        download_name="THE_LEGACY_CIRCLE_OFFICIAL_CONSTITUTION.pdf",
        mimetype="application/pdf"
    )


