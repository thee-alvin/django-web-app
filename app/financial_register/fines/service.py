from datetime import datetime

from ..ledger_service import build_financial_ledger


def build_fines_register(
    year=None,
    month=None,
):
    ledger = build_financial_ledger(
        year=year,
        month=month,
    )

    members = []
    all_fines = []

    for member in ledger["members"]:

        fine_transactions = [
            transaction
            for transaction in member["transactions"]
            if str(
                transaction.get("payment_type", "")
            ).strip().upper() == "FINE"
        ]

        if not fine_transactions:
            continue

        fine_total = sum(
            float(
                transaction.get("amount", 0) or 0
            )
            for transaction in fine_transactions
        )

        member_record = {
            "member_id": member["member_id"],
            "full_name": member["full_name"],
            "fine_total": fine_total,
            "fine_count": len(fine_transactions),
            "transactions": fine_transactions,
        }

        members.append(member_record)

        all_fines.extend(
            {
                **transaction,
                "member_id": member["member_id"],
                "full_name": member["full_name"],
            }
            for transaction in fine_transactions
        )

    members.sort(
        key=lambda item: item["member_id"]
    )

    all_fines.sort(
        key=lambda item: (
            item.get("date", ""),
            item.get("time", ""),
        ),
        reverse=True,
    )

    total_fines = sum(
        member["fine_total"]
        for member in members
    )

    if month and year:
        period_label = datetime(
            int(year),
            int(month),
            1,
        ).strftime("%B %Y")

    elif year:
        period_label = f"Year {year}"

    else:
        period_label = "All Recorded Fines"

    return {
        "period": {
            "year": str(year) if year else None,
            "month": (
                f"{int(month):02d}"
                if month
                else None
            ),
            "label": period_label,
        },

        "generated_at": datetime.now().isoformat(
            timespec="seconds"
        ),

        "summary": {
            "members_with_fines": len(members),
            "fine_transactions": len(all_fines),
            "total_fines": total_fines,
        },

        "members": members,

        "transactions": all_fines,
    }
