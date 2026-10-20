from email.message import EmailMessage


def build_receipt_email(
    recipient_email,
    member_name,
    receipt_number,
    amount,
    payment_type,
    payment_date,
):
    """
    Build the TLC receipt email without sending it.
    """

    recipient_email = str(recipient_email).strip()
    member_name = str(member_name).strip()
    receipt_number = str(receipt_number).strip()
    payment_type = str(payment_type).strip()
    payment_date = str(payment_date).strip()

    amount = float(amount)

    if not recipient_email:
        raise ValueError("Recipient email is required.")

    if not receipt_number:
        raise ValueError("Receipt number is required.")

    message = EmailMessage()

    message["Subject"] = (
        f"TLC Payment Receipt - {receipt_number}"
    )

    message["To"] = recipient_email

    message["From"] = (
        "The Legacy Circle <no-reply@thelegacycircle.org>"
    )

    message.set_content(
        f"""
Dear {member_name},

Thank you for your payment to The Legacy Circle (TLC).

Receipt Number: {receipt_number}
Payment Type: {payment_type}
Amount: KES {amount:,.2f}
Payment Date: {payment_date}

This email serves as confirmation of your TLC payment.

Please keep this receipt for your records.

THE LEGACY CIRCLE (TLC)

Powered by THEE ALVIN TECH SOLUTIONS
© 2026 All Rights Reserved.
"""
    )

    return message


def get_email_preview(message):
    """
    Return basic information about a prepared receipt email.
    """

    return {
        "to": message.get("To", ""),
        "subject": message.get("Subject", ""),
        "body": message.get_content(),
    }
