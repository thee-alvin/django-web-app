from ..ledger_service import build_financial_ledger
from ..contribution_coverage import (
    get_member_monthly_coverage,
)


def build_member_statement(
    member_id,
    year=None,
    month=None,
):
    member_id = str(
        member_id or ""
    ).strip().upper()

    if not member_id:
        raise ValueError(
            "Member ID is required."
        )

    report = build_financial_ledger(
        year=year,
        month=month,
    )

    for member in report["members"]:

        if (
            str(
                member.get("member_id", "")
            ).strip().upper()
            == member_id
        ):
            coverage = None

            if year and month:
                coverage = (
                    get_member_monthly_coverage(
                        member_id=member["member_id"],
                        year=int(year),
                        month=int(month),
                    )
                )

            return {
                "period": report["period"],
                "generated_at": report[
                    "generated_at"
                ],

                "member": {
                    "member_id":
                        member["member_id"],

                    "full_name":
                        member["full_name"],

                    "registration_fees":
                        member["registration_fees"],

                    "weekly_contributions":
                        member["weekly_contributions"],

                    "total_contributions":
                        member["total_contributions"],

                    "fines":
                        member["fines"],

                    "transaction_count":
                        member["transaction_count"],

                    "transactions":
                        member["transactions"],

                    "coverage":
                        coverage,
                },
            }

    return None

