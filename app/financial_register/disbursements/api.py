from flask import send_from_directory
from pathlib import Path

from flask import (
    Blueprint,
    jsonify,
    request,
)

from app.auth.session import get_current_member_id
from app.security.audit_log import record_activity

from .service import (
    build_disbursement_register,
    record_disbursement,
)


disbursement_api = Blueprint(
    "disbursement_api",
    __name__
)


ADMIN_MEMBER_ID = "TLC/001/2026"


def _is_authorized():

    return (
        str(
            get_current_member_id() or ""
        ).strip().upper()
        == ADMIN_MEMBER_ID
    )


@disbursement_api.get(
    "/api/tlc/disbursements"
)
def get_disbursements():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    year = (
        request.args.get("year")
        or None
    )

    month = (
        request.args.get("month")
        or None
    )

    try:

        if year:
            if (
                not str(year).isdigit()
                or len(str(year)) != 4
            ):
                return jsonify({
                    "success": False,
                    "message": "Invalid year."
                }), 400

            year = str(year)

        if month:

            if (
                not str(month).isdigit()
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

        result = build_disbursement_register(
            year=year,
            month=month,
        )

        return jsonify({
            "success": True,
            "register": result,
        })

    except Exception as exc:

        return jsonify({
            "success": False,
            "message": str(exc),
        }), 500


@disbursement_api.post(
    "/api/tlc/disbursements"
)
def create_disbursement():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    try:

        result = record_disbursement(
            amount=data.get("amount"),
            category=data.get("category"),
            purpose=data.get("purpose"),
            paid_to=data.get("paid_to"),
            payment_method=data.get(
                "payment_method"
            ),
            reference=data.get(
                "reference"
            ),
            authorized_by=data.get(
                "authorized_by"
            ),
            recorded_by=data.get(
                "recorded_by"
            ),
            notes=data.get(
                "notes",
                ""
            ),
            transaction_date=data.get(
                "date"
            ),
            transaction_time=data.get(
                "time"
            ),
        )

        record_activity(
            ADMIN_MEMBER_ID,
            action="Treasury Disbursement Recorded",
            description=(
                f"Disbursement "
                f"{result['disbursement_id']} "
                f"recorded for KSh "
                f"{result['amount']:,.2f}."
            ),
            category="financial",
            details={
                "disbursement_id":
                    result[
                        "disbursement_id"
                    ],
                "amount":
                    result["amount"],
                "category":
                    result["category"],
                "purpose":
                    result["purpose"],
                "paid_to":
                    result["paid_to"],
                "payment_method":
                    result[
                        "payment_method"
                    ],
                "reference":
                    result["reference"],
            },
        )

        return jsonify({
            "success": True,
            "disbursement": result,
        }), 201

    except ValueError as exc:

        return jsonify({
            "success": False,
            "message": str(exc),
        }), 400

    except Exception as exc:

        return jsonify({
            "success": False,
            "message": str(exc),
        }), 500

@disbursement_api.get("/tlc-disbursements")
def disbursements_page():
    frontend_dir = Path(__file__).resolve().parents[3] / "frontend" / "pages"
    return send_from_directory(frontend_dir,"tlc_disbursements.html")

