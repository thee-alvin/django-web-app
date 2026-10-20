from pathlib import Path

from flask import (
    Blueprint,
    jsonify,
    request,
    send_from_directory,
)

from app.auth.session import get_current_member_id
from .ledger_service import build_financial_ledger


financial_register_api = Blueprint(
    "financial_register_api",
    __name__
)

BASE_DIR = Path(__file__).resolve().parents[2]

FRONTEND_DIR = (
    BASE_DIR / "frontend"
)

ADMIN_MEMBER_ID = "TLC/001/2026"


def _is_authorized():
    return (
        str(
            get_current_member_id() or ""
        ).strip().upper()
        == ADMIN_MEMBER_ID
    )


def _clean(value):
    return str(value or "").strip()


@financial_register_api.get(
    "/api/tlc/financial-register"
)
def financial_register():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    year = _clean(
        request.args.get("year")
    )

    month = _clean(
        request.args.get("month")
    )

    if year:
        if (
            not year.isdigit()
            or len(year) != 4
        ):
            return jsonify({
                "success": False,
                "message": "Invalid year."
            }), 400
    else:
        year = None

    if month:

        if (
            not month.isdigit()
            or not 1 <= int(month) <= 12
        ):
            return jsonify({
                "success": False,
                "message": "Invalid month."
            }), 400

        if not year:
            return jsonify({
                "success": False,
                "message": (
                    "A month requires a year."
                )
            }), 400

        month = str(
            int(month)
        ).zfill(2)

    else:
        month = None

    try:

        report = build_financial_ledger(
            year=year,
            month=month,
        )

        return jsonify({
            "success": True,
            "report": report,
        })

    except FileNotFoundError as error:

        return jsonify({
            "success": False,
            "message": str(error),
        }), 500

    except Exception:

        return jsonify({
            "success": False,
            "message": (
                "Unable to build the TLC "
                "financial register."
            ),
        }), 500


@financial_register_api.get(
    "/tlc-financial-register"
)
def financial_register_page():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    return send_from_directory(
        FRONTEND_DIR / "pages",
        "tlc_financial_register.html"
    )
