from flask import Blueprint, jsonify, session

from .payment_service import (
    get_member_contributions,
)


financial_summary_bp = Blueprint(
    "financial_summary",
    __name__,
)


EXCLUDED_STATUSES = {
    "CANCELLED",
    "REJECTED",
}


@financial_summary_bp.get("/api/member/financial-summary")
def member_financial_summary():

    member_id = session.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "You must be logged in.",
        }), 401

    try:
        contributions = get_member_contributions(
            member_id
        )

        valid = [
            item
            for item in contributions
            if str(
                item.get("status") or ""
            ).strip().upper()
            not in EXCLUDED_STATUSES
        ]

        total = sum(
            float(item.get("amount") or 0)
            for item in valid
        )

        current_year = str(
            __import__("datetime").datetime.now().year
        )

        current_month = (
            __import__("datetime").datetime.now()
            .strftime("%Y-%m")
        )

        this_year = sum(
            float(item.get("amount") or 0)
            for item in valid
            if str(
                item.get("payment_date") or ""
            ).startswith(current_year)
        )

        this_month = sum(
            float(item.get("amount") or 0)
            for item in valid
            if str(
                item.get("payment_date") or ""
            ).startswith(current_month)
        )

        amounts = [
            float(item.get("amount") or 0)
            for item in valid
        ]

        average = (
            sum(amounts) / len(amounts)
            if amounts
            else 0
        )

        return jsonify({
            "success": True,
            "member_id": member_id,
            "summary": {
                "total": total,
                "this_month": this_month,
                "this_year": this_year,
                "payment_count": len(valid),
                "average": average,
                "first_contribution": (
                    valid[-1]
                    if valid
                    else None
                ),
                "latest_contribution": (
                    valid[0]
                    if valid
                    else None
                ),
            },
        })

    except Exception:
        return jsonify({
            "success": False,
            "message": "Unable to load your financial summary.",
        }), 500
