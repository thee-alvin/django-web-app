from flask import Blueprint, jsonify, send_file

from app.auth.session import get_current_member_id
from .exporter import create_excel_report, create_pdf_report


financial_export_api = Blueprint(
    "financial_export_api",
    __name__
)

ADMIN_MEMBER_ID = "TLC/001/2026"


def _is_authorized():
    return (
        str(get_current_member_id() or "").strip().upper()
        == ADMIN_MEMBER_ID
    )


@financial_export_api.get("/api/tlc/financial-register/excel")
def download_excel():
    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    try:
        report = create_excel_report()

        return send_file(
            report,
            mimetype=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            as_attachment=True,
            download_name="TLC_Financial_Register.xlsx",
        )

    except Exception:
        return jsonify({
            "success": False,
            "message": "Unable to generate the Excel report."
        }), 500


@financial_export_api.get("/api/tlc/financial-register/pdf")
def download_pdf():
    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    try:
        report = create_pdf_report()

        return send_file(
            report,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="TLC_Financial_Register.pdf",
        )

    except Exception:
        return jsonify({
            "success": False,
            "message": "Unable to generate the PDF report."
        }), 500
