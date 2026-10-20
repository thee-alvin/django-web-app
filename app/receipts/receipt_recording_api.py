from flask import Blueprint, jsonify, request

from app.receipts.receipt_number import format_receipt_number
from app.receipts.receipt_generator import create_receipt
from app.receipts.receipt_pdf_generator import generate_receipt_pdf
from app.services.email_service import send_receipt_email

from app.security.audit_log import record_activity

from app.receipts.receipt_storage import (
    add_receipt,
    get_member_details,
    load_receipts,
)


receipt_recording_api = Blueprint(
    "receipt_recording_api",
    __name__,
    url_prefix="/api/receipts"
)


def get_next_receipt_number():
    """Generate the next sequential TLC receipt number."""

    receipts = load_receipts()

    current_year = __import__("datetime").datetime.now().year

    highest_sequence = 0

    for receipt in receipts:

        receipt_number = str(
            receipt.get("receipt_number", "")
        ).strip()

        parts = receipt_number.split("/")

        if len(parts) != 4:
            continue

        if parts[0] != "TLC":
            continue

        if parts[1] != "RCPT":
            continue

        if parts[2] != str(current_year):
            continue

        try:
            sequence = int(parts[3])
        except ValueError:
            continue

        highest_sequence = max(
            highest_sequence,
            sequence
        )

    return format_receipt_number(
        highest_sequence + 1,
        current_year
    )


@receipt_recording_api.route(
    "/record",
    methods=["POST"]
)
def record_receipt():

    data = request.get_json(silent=True) or {}

    member_id = str(
        data.get("member_id", "")
    ).strip().upper()

    amount = data.get("amount")

    payment_type = str(
        data.get("payment_type", "")
    ).strip()

    payment_reference = str(
        data.get("payment_reference", "")
    ).strip()

    description = str(
        data.get("description", "")
    ).strip()

    payment_method = str(
        data.get("payment_method", "M-PESA")
    ).strip()

    recorded_by = str(
        data.get("recorded_by", "")
    ).strip()


    if not member_id:

        return jsonify({
            "success": False,
            "message": "Member ID is required."
        }), 400


    if amount is None:

        return jsonify({
            "success": False,
            "message": "Payment amount is required."
        }), 400


    if not payment_type:

        return jsonify({
            "success": False,
            "message": "Payment type is required."
        }), 400


    member = get_member_details(
        member_id
    )


    if not member:

        return jsonify({
            "success": False,
            "message": "Member ID was not found."
        }), 404


    try:

        receipt_number = (
            get_next_receipt_number()
        )

        receipt = create_receipt(
            member_id=member["member_id"],
            member_name=member["full_name"],
            amount=amount,
            payment_type=payment_type,
            payment_reference=payment_reference,
            description=description,
            receipt_number=receipt_number,
            phone_number=member["phone_number"],
            email=member["email"],
            payment_method=payment_method,
            recorded_by=recorded_by,
        )

        saved_receipt = add_receipt(
            receipt
        )

        record_activity(
            member_id,
            action="Receipt Generated",
            description=(
                f"Receipt {receipt_number} was generated "
                f"for KES {float(amount):,.2f}."
            ),
            category="receipt",
            details={
                "receipt_number": receipt_number,
                "amount": float(amount),
                "payment_type": payment_type,
                "payment_method": payment_method,
                "payment_reference": payment_reference,
            }
        )

        # ==========================================
        # GENERATE THE EXACT PORTAL RECEIPT AS PDF
        # ==========================================

        receipt_pdf = generate_receipt_pdf(
            saved_receipt
        )

        # ==========================================
        # AUTOMATIC TLC RECEIPT PDF EMAIL
        # ==========================================

        email_sent = False
        email_message = ""

        member_email = str(
            member.get("email", "")
        ).strip()

        if member_email:

            email_sent, email_message = (
                send_receipt_email(
                    recipient_email=member_email,
                    receipt_number=receipt_number,
                    member_name=member["full_name"],
                    amount=amount,
                    pdf_bytes=receipt_pdf
                )
            )

        else:

            email_message = (
                "Member has no email address."
            )

        return jsonify({
            "success": True,
            "message": "Receipt created successfully.",
            "receipt": saved_receipt,
            "email_sent": email_sent,
            "email_message": email_message
        }), 201


    except ValueError as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 400


    except Exception:

        return jsonify({
            "success": False,
            "message": "Unable to create the receipt."
        }), 500






