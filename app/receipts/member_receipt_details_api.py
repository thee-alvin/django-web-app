from flask import Blueprint, jsonify

from app.auth.session import get_current_member_id

from app.receipts.receipt_storage import (
    get_receipts_for_member,
    load_receipts,
    enrich_receipt_with_member
)

from app.security.audit_log import record_activity


member_receipt_details_api = Blueprint(
    "member_receipt_details_api",
    __name__,
    url_prefix="/api/member/receipt"
)


# ============================================================
# TLC AUTHORIZED FINANCIAL ACCOUNT
# ============================================================

ADMIN_MEMBER_ID = "TLC/001/2026"


def _is_financial_admin():
    """
    Check whether the current session belongs to the
    authorized TLC financial account.
    """

    current_member_id = str(
        get_current_member_id() or ""
    ).strip().upper()

    return current_member_id == ADMIN_MEMBER_ID


def _find_admin_receipt(receipt_number):
    """
    Find any stored receipt.

    This function is available only to the authorized
    TLC financial account.
    """

    receipt_number = str(
        receipt_number
    ).strip()

    for receipt in load_receipts():

        if not isinstance(receipt, dict):
            continue

        stored_number = str(
            receipt.get("receipt_number", "")
        ).strip()

        if stored_number != receipt_number:
            continue

        return enrich_receipt_with_member(
            receipt
        )

    return None


@member_receipt_details_api.route(
    "/<path:receipt_number>",
    methods=["GET"]
)
def get_member_receipt(receipt_number):

    member_id = str(
        get_current_member_id() or ""
    ).strip().upper()

    if not member_id:

        return jsonify({
            "success": False,
            "message": "Please log in to view this receipt."
        }), 401

    receipt_number = str(
        receipt_number
    ).strip()


    # ========================================================
    # TREASURER / FINANCIAL ADMIN ACCESS
    # ========================================================

    if _is_financial_admin():

        receipt = _find_admin_receipt(
            receipt_number
        )

        if receipt is None:

            return jsonify({
                "success": False,
                "message": "Receipt not found."
            }), 404

        record_activity(
            member_id,
            action="Viewed Receipt",
            description=(
                f"Financial administrator viewed "
                f"receipt {receipt_number}."
            ),
            category="receipts",
            details={
                "receipt_number": receipt_number,
                "receipt_member_id": receipt.get(
                    "member_id",
                    ""
                ),
                "amount": receipt.get(
                    "amount",
                    ""
                ),
                "payment_type": receipt.get(
                    "payment_type",
                    ""
                )
            }
        )

        return jsonify({
            "success": True,
            "receipt": receipt
        })


    # ========================================================
    # NORMAL MEMBER ACCESS
    # Members can only view their own receipts.
    # ========================================================

    receipts = get_receipts_for_member(
        member_id
    )

    for receipt in receipts:

        if str(
            receipt.get(
                "receipt_number",
                ""
            )
        ).strip() != receipt_number:

            continue

        record_activity(
            member_id,
            action="Viewed Receipt",
            description=(
                f"Viewed receipt {receipt_number}."
            ),
            category="receipts",
            details={
                "receipt_number": receipt_number,
                "amount": receipt.get(
                    "amount",
                    ""
                )
            }
        )

        return jsonify({
            "success": True,
            "receipt": receipt
        })

    return jsonify({
        "success": False,
        "message": "Receipt not found."
    }), 404
