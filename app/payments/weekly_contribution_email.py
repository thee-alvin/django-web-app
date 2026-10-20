import os
import smtplib
from pathlib import Path
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env", encoding="utf-8-sig", override=True)


def send_weekly_contribution_reminder(
    recipient_email,
    recipient_name,
    week_date,
    amount=100,
):
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

    name = str(
        recipient_name or ""
    ).strip()

    first_name = (
        name.split()[0]
        if name
        else "TLC Member"
    )

    email = EmailMessage()

    email["From"] = (
        f"{sender_name} <{smtp_username}>"
    )

    email["To"] = recipient_email

    email["Subject"] = (
        "TLC Weekly Contribution Reminder"
    )

    email.set_content(
        f"""
Dear {first_name},

This is your weekly contribution reminder from
THE LEGACY CIRCLE (TLC).

Your weekly contribution for Thursday,
{week_date}, is due.

Weekly contribution:
KES {amount:,.2f}

TLC M-PESA TILL:
1693991

Please make your contribution through the official
TLC Till and keep your M-PESA confirmation message
and transaction reference for your records.

Once your payment is recorded in the TLC system,
your official receipt will be processed and emailed
to you automatically.

Thank you for your consistency and commitment to
The Legacy Circle.

THE LEGACY CIRCLE (TLC)
Powered by THEE ALVIN TECH SOLUTIONS
© 2026 All Rights Reserved.
""".strip()
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

            server.send_message(email)

        return True, (
            "Weekly contribution reminder sent successfully."
        )

    except Exception as error:

        return False, str(error)


