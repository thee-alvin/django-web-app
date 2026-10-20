from datetime import datetime


def create_receipt(
    member_id,
    member_name,
    amount,
    payment_type,
    payment_reference="",
    description="",
    receipt_number="",
    payment_date=None,
    phone_number="",
    email="",
    payment_method="M-PESA",
    recorded_by="",
):
    """
    Create a complete TLC receipt record.
    """

    member_id = str(member_id).strip().upper()
    member_name = str(member_name).strip()
    payment_type = str(payment_type).strip()
    payment_reference = str(payment_reference).strip()
    description = str(description).strip()
    receipt_number = str(receipt_number).strip()
    phone_number = str(phone_number).strip()
    email = str(email).strip()
    payment_method = str(payment_method).strip()
    recorded_by = str(recorded_by).strip()

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        raise ValueError("Receipt amount must be a valid number.")

    if not member_id:
        raise ValueError("Member ID is required.")

    if not member_name:
        raise ValueError("Member name is required.")

    if amount <= 0:
        raise ValueError("Receipt amount must be greater than zero.")

    if not payment_type:
        raise ValueError("Payment type is required.")

    now = datetime.now()

    if payment_date is None:
        payment_date = now.strftime("%Y-%m-%d")

    return {
        "receipt_number": receipt_number,
        "member_id": member_id,
        "member_name": member_name,
        "full_name": member_name,
        "phone_number": phone_number,
        "email": email,
        "amount": amount,
        "payment_type": payment_type,
        "description": description,
        "payment_method": payment_method,
        "payment_reference": payment_reference,
        "transaction_reference": payment_reference,
        "payment_date": payment_date,
        "payment_time": now.strftime("%H:%M:%S"),
        "status": "Issued",
        "recorded_by": recorded_by,
        "created_at": now.isoformat(timespec="seconds"),
    }
