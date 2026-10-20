import os
import smtplib
from email.message import EmailMessage


from pathlib import Path

from dotenv import load_dotenv, dotenv_values


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env", override=True)


def send_meeting_email(
    recipient_email,
    recipient_name,
    meeting_id,
    meeting_date,
    meeting_time,
    meeting_type,
    venue,
    agenda,
    chairperson,
    secretary,
    status,
    is_update=False,
):
    """
    Send a personalized TLC meeting notification.
    """

    smtp_config = dotenv_values(BASE_DIR / ".env", encoding="utf-8-sig")
    smtp_host = smtp_config.get("TLC_SMTP_HOST")
    smtp_port = int(
        smtp_config.get("TLC_SMTP_PORT", "587")
    )
    smtp_username = smtp_config.get(
        "TLC_SMTP_USERNAME"
    )
    smtp_password = smtp_config.get(
        "TLC_SMTP_PASSWORD"
    )
    sender_name = smtp_config.get(
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

    full_name = str(
        recipient_name or ""
    ).strip()

    first_name = (
        full_name.split()[0]
        if full_name
        else "TLC Member"
    )

    subject_prefix = (
        "TLC Meeting Updated"
        if is_update
        else "New TLC Meeting"
    )

    body = f"""
Dear {first_name},

{"A TLC meeting has been updated." if is_update else "A new TLC meeting has been scheduled."}

MEETING DETAILS

Meeting ID:
{meeting_id}

Meeting Date:
{meeting_date}

Meeting Time:
{meeting_time}

Meeting Type:
{meeting_type}

Venue:
{venue}

Agenda:
{agenda}

Chairperson:
{chairperson}

Secretary:
{secretary}

Status:
{status}

Please log in to the THE LEGACY CIRCLE member portal to view the latest meeting information.

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
        f"{subject_prefix}: {meeting_type}"
    )

    email.set_content(
        body.strip()
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

        return True, "Meeting email sent successfully."

    except Exception as error:

        return False, str(error)










