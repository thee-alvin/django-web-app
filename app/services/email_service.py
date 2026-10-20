import os
from pathlib import Path
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env", encoding="utf-8-sig", override=True)


def send_receipt_email(
    recipient_email,
    receipt_number,
    member_name,
    amount,
    pdf_bytes,
):
    """
    Send the complete TLC receipt as a PDF attachment.

    The PDF is generated from the existing TLC portal
    receipt page, so the emailed document is the same
    receipt shown in the portal.
    """

    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(env_path, override=True)

    smtp_host = os.getenv("TLC_SMTP_HOST")
    smtp_port = int(
        os.getenv("TLC_SMTP_PORT", "587")
    )
    smtp_username = os.getenv(
        "TLC_SMTP_USERNAME"
    )
    smtp_password = os.getenv(
        "TLC_SMTP_PASSWORD"
    )
    sender_name = os.getenv(
        "TLC_EMAIL_NAME",
        "THE LEGACY CIRCLE (TLC)"
    )

    if not recipient_email:
        return False, "Recipient email is missing."

    if not smtp_host:
        return False, "TLC_SMTP_HOST is not configured."

    if not smtp_username:
        return False, "TLC_SMTP_USERNAME is not configured."

    if not smtp_password:
        return False, "TLC_SMTP_PASSWORD is not configured."

    if not pdf_bytes:
        return False, "Receipt PDF is empty."

    safe_receipt_number = (
        str(receipt_number)
        .strip()
        .replace("/", "_")
    )

    filename = (
        f"TLC_Payment_Receipt_"
        f"{safe_receipt_number}.pdf"
    )

    message = EmailMessage()

    message["From"] = (
        f"{sender_name} <{smtp_username}>"
    )

    message["To"] = recipient_email

    message["Subject"] = (
        f"TLC Payment Receipt - {receipt_number}"
    )

    message.set_content(
        f"""
Dear {member_name},

Thank you for your contribution to
THE LEGACY CIRCLE (TLC).

Your payment has been successfully recorded.

Your complete official TLC payment receipt
is attached to this email as a PDF document.

Receipt Number: {receipt_number}
Amount Received: KES {float(amount):,.2f}

Please download and keep the attached receipt
for your records.

THE LEGACY CIRCLE (TLC)
Powered by THEE ALVIN TECH SOLUTIONS
© 2026 All Rights Reserved.
"""
    )

    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=filename,
    )

    try:

        with smtplib.SMTP(
            smtp_host,
            smtp_port,
            timeout=30
        ) as server:

            server.ehlo()
            server.starttls()
            server.ehlo()

            server.login(
                smtp_username,
                smtp_password
            )

            server.send_message(message)

        return True, (
            "Receipt PDF emailed successfully."
        )

    except Exception as error:

        return False, str(error)




