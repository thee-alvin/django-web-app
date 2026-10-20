import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv
from pathlib import Path


load_dotenv(Path(__file__).resolve().parents[2] / ".env", encoding="utf-8-sig", override=True)


def send_announcement_email(
    recipient_email,
    recipient_name,
    title,
    message,
    announcement_type="GENERAL",
    priority="NORMAL",
    announcement_date="",
    expiry_date="",
    is_update=False,
):
    """
    Send a personalized TLC announcement notification email.
    """

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

    if not name:
        name = "TLC Member"

    # Use the member's first name for the greeting.
    first_name = name.split()[0]

    subject_prefix = (
        "TLC Announcement Updated"
        if is_update
        else "New TLC Announcement"
    )

    message_body = f"""
Dear {first_name},

{"An announcement has been updated." if is_update else "A new announcement has been posted."}

TITLE:
{title}

ANNOUNCEMENT TYPE:
{announcement_type}

PRIORITY:
{priority}

DATE:
{announcement_date}

{"EXPIRY DATE:" if expiry_date else ""}
{expiry_date if expiry_date else ""}

MESSAGE:
{message}

Please log in to the THE LEGACY CIRCLE member portal to view the latest announcement.

THE LEGACY CIRCLE (TLC)
Powered by THEE ALVIN TECH SOLUTIONS
© 2026 All Rights Reserved.
"""

    email = EmailMessage()

    email["From"] = (
        f"{sender_name} <{smtp_username}>"
    )

    email["To"] = recipient_email

    email["Subject"] = (
        f"{subject_prefix}: {title}"
    )

    email.set_content(
        message_body.strip()
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

        return True, "Announcement email sent successfully."

    except Exception as error:

        return False, str(error)


