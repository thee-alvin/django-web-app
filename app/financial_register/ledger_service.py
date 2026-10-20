from pathlib import Path
from datetime import datetime, date

from openpyxl import load_workbook

from .disbursements.service import build_disbursement_register


BASE_DIR = Path(__file__).resolve().parents[2]

MEMBERS_FILE = (
    BASE_DIR
    / "data"
    / "spreadsheets"
    / "01_MEMBERS.xlsx"
)

CONTRIBUTIONS_FILE = (
    BASE_DIR
    / "data"
    / "spreadsheets"
    / "02_CONTRIBUTIONS.xlsx"
)

EXCLUDED_STATUSES = {
    "CANCELLED",
    "REJECTED",
}


def _clean(value):
    if value is None:
        return ""

    return str(value).strip()


def _amount(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _format_date(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")

    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")

    text = _clean(value)

    if not text:
        return ""

    try:
        return datetime.fromisoformat(
            text.replace("Z", "+00:00")
        ).strftime("%Y-%m-%d")
    except ValueError:
        pass

    if " " in text:
        return text.split(" ", 1)[0]

    return text


def _format_time(value):
    if isinstance(value, datetime):
        return value.strftime("%H:%M:%S")

    if hasattr(value, "strftime"):
        try:
            return value.strftime("%H:%M:%S")
        except Exception:
            pass

    return _clean(value)


def _load_members():
    workbook = load_workbook(
        MEMBERS_FILE,
        read_only=True,
        data_only=True,
    )

    try:
        sheet = workbook["Members"]

        rows = sheet.iter_rows(values_only=True)
        headers = next(rows, None)

        if not headers:
            return {}

        headers = [
            _clean(value)
            for value in headers
        ]

        member_id_index = headers.index(
            "Member ID"
        )

        name_index = headers.index(
            "Full Name"
        )

        members = {}

        for row in rows:

            member_id = _clean(
                row[member_id_index]
                if member_id_index < len(row)
                else ""
            ).upper()

            if not member_id:
                continue

            if member_id.startswith("TLC/TEST/"):
                continue

            name = _clean(
                row[name_index]
                if name_index < len(row)
                else ""
            )

            members[member_id] = {
                "member_id": member_id,
                "full_name": name or member_id,
            }

        return members

    finally:
        workbook.close()


def _load_transactions():
    workbook = load_workbook(
        CONTRIBUTIONS_FILE,
        read_only=True,
        data_only=True,
    )

    try:
        sheet = workbook["Contributions"]

        rows = sheet.iter_rows(values_only=True)
        headers = next(rows, None)

        if not headers:
            return []

        headers = [
            _clean(value)
            for value in headers
        ]

        records = []

        for row in rows:

            if not any(
                value is not None
                for value in row
            ):
                continue

            records.append(
                dict(zip(headers, row))
            )

        return records

    finally:
        workbook.close()


def _matches_period(
    payment_date,
    year=None,
    month=None,
):
    if not payment_date:
        return False

    if year:
        if not payment_date.startswith(
            f"{year}-"
        ):
            return False

    if month:
        month_text = f"{int(month):02d}"

        if not payment_date.startswith(
            f"{year}-{month_text}"
        ):
            return False

    return True


def _build_financial_ledger_cash(
    year=None,
    month=None,
):
    if month and not year:
        raise ValueError(
            "A month requires a year."
        )

    members = _load_members()
    records = _load_transactions()

    disbursement_report = build_disbursement_register(
        year=year,
        month=month,
    )

    total_money_out = float(
        disbursement_report["summary"]["total_withdrawals"]
        or 0
    )

    ledger = {}

    for member_id, member in members.items():

        ledger[member_id] = {
            "member_id": member_id,
            "full_name": member["full_name"],

            "registration_fees": 0.0,
            "weekly_contributions": 0.0,
            "total_contributions": 0.0,
            "fines": 0.0,

            "transaction_count": 0,

            "transactions": [],
        }

    for record in records:

        status = _clean(
            record.get("Status")
        ).upper()

        if status in EXCLUDED_STATUSES:
            continue

        payment_date = _format_date(
            record.get("Payment Date")
        )

        if year or month:

            if not _matches_period(
                payment_date,
                year,
                month,
            ):
                continue

        member_id = _clean(
            record.get("Member ID")
        ).upper()

        if not member_id:
            continue

        if member_id.startswith("TLC/TEST/"):
            continue

        if member_id not in ledger:

            ledger[member_id] = {
                "member_id": member_id,

                "full_name": (
                    _clean(
                        record.get(
                            "Full Name"
                        )
                    )
                    or member_id
                ),

                "registration_fees": 0.0,
                "weekly_contributions": 0.0,
                "total_contributions": 0.0,
                "fines": 0.0,

                "transaction_count": 0,

                "transactions": [],
            }

        member = ledger[member_id]

        amount = _amount(
            record.get("Amount")
        )

        payment_type = _clean(
            record.get("Payment Type")
        ).upper()

        description = _clean(
            record.get("Description")
        )

        payment_method = _clean(
            record.get("Payment Method")
        ) or "M-PESA"

        transaction = {
            "date": payment_date,

            "time": _format_time(
                record.get(
                    "Payment Time"
                )
            ),

            "payment_type": payment_type,

            "description": description or payment_type,

            "payment_method": payment_method,

            "transaction_reference": _clean(
                record.get("Transaction Reference")
            ),

            "amount": amount,

            "receipt_number": _clean(record.get("Receipt Number")),
        }

        member["transactions"].append(
            transaction
        )

        member["transaction_count"] += 1

        if payment_type == "REGISTRATION FEE":

            member["registration_fees"] += amount

        elif payment_type == "WEEKLY CONTRIBUTION":

            member["weekly_contributions"] += amount

        elif payment_type == "FINE":

            member["fines"] += amount

    members_list = list(
        ledger.values()
    )

    for member in members_list:

        member["total_contributions"] = (
            member["registration_fees"]
            + member["weekly_contributions"]
        )

        member["transactions"].sort(
            key=lambda item: (
                item["date"],
                item["time"],
            ),
            reverse=True,
        )

    def member_id_number(member):
        member_id = str(
            member.get("member_id", "")
        ).strip().upper()

        parts = member_id.split("/")

        if (
            len(parts) == 3
            and parts[0] == "TLC"
            and parts[1].isdigit()
            and parts[2].isdigit()
        ):
            try:
                return int(parts[1])
            except ValueError:
                pass

        return 999999999

    members_list.sort(
        key=lambda member: (
            member_id_number(member),
            member.get("member_id", ""),
        )
    )

    summary = {
        "members": len(members_list),

        "members_with_transactions": sum(
            1
            for member in members_list
            if member["transaction_count"] > 0
        ),

        "registration_fees": sum(
            member["registration_fees"]
            for member in members_list
        ),

        "weekly_contributions": sum(
            member["weekly_contributions"]
            for member in members_list
        ),

        "total_contributions": sum(
            member["total_contributions"]
            for member in members_list
        ),

        "fines": sum(
            member["fines"]
            for member in members_list
        ),

        "transactions": sum(
            member["transaction_count"]
            for member in members_list
        ),
    }

    summary["total_money_in"] = (
        summary["total_contributions"]
        + summary["fines"]
    )

    summary["total_money_out"] = (
        total_money_out
    )

    summary["disbursement_transactions"] = (
        disbursement_report["summary"]["transactions"]
    )

    summary["current_balance"] = (
        summary["total_money_in"]
        - summary["total_money_out"]
    )

    summary["total_funds"] = (
        summary["current_balance"]
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

        period_label = "All Recorded Transactions"

    return {
        "period": {
            "year": str(year)
            if year
            else None,

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

        "summary": summary,

        "members": members_list,

        "money_out": disbursement_report.get(
            "transactions",
            []
        ),
    }











# ============================================================
# MONTHLY CONTRIBUTION COVERAGE REPORTING
#
# The underlying cash ledger remains unchanged.
#
# For a selected month:
#
#   contribution = weeks covered during that month
#
# rather than:
#
#   contribution = payment transaction date only
#
# Example:
#
#   10 Sep 2026 → KSh 1,000 → 10 weeks
#
# October:
#
#   Weeks 4–8 → KSh 500 contribution coverage
#
# The original cash payment remains dated 10 Sep.
# ============================================================

def build_financial_ledger(year=None, month=None):

    report = _build_financial_ledger_cash(
        year=year,
        month=month
    )

    # Full register requests keep the original behaviour.
    if year is None or month is None:
        return report

    try:
        selected_year = int(year)
        selected_month = int(month)
    except (TypeError, ValueError):
        return report

    try:
        from app.financial_register.contribution_coverage.service import (
            get_member_monthly_coverage
        )
    except Exception as error:
        print(
            "[FINANCIAL REGISTER COVERAGE IMPORT ERROR]",
            repr(error),
            flush=True
        )
        return report

    summary = report.setdefault(
        "summary",
        {}
    )

    members = report.get("members") or []

    old_cash_weekly = float(
        summary.get("weekly_contributions") or 0
    )

    old_cash_total = float(
        summary.get("total_contributions") or 0
    )

    total_coverage_amount = 0.0
    total_coverage_weeks = 0
    total_coverage_transactions = 0

    members_with_transactions = 0
    total_transactions = 0

    monthly_coverage_rows = []

    # Build a separate all-time register specifically for recovering
    # original payment metadata such as the recorded transaction time.
    from app.financial_register.service import (
        build_financial_register as _build_full_register_for_time
    )

    source_register_for_times = (
        _build_full_register_for_time()
        or {}
    )

    all_time_members = (
        source_register_for_times.get("members")
        or []
    )

    source_time_by_receipt = {}

    for source_member in all_time_members:

        if not isinstance(source_member, dict):
            continue

        for source_transaction in (
            source_member.get("transactions")
            or []
        ):

            if not isinstance(source_transaction, dict):
                continue

            receipt_key = (
                source_transaction.get("receipt_number")
                or source_transaction.get("receipt_reference")
                or source_transaction.get("Receipt Number")
                or ""
            )

            source_time = (
                source_transaction.get("time")
                or source_transaction.get("payment_time")
                or source_transaction.get("received_time")
                or ""
            )

            if receipt_key and source_time:
                source_time_by_receipt[
                    str(receipt_key).strip().upper()
                ] = str(source_time).strip()

    for member in members:

        if not isinstance(member, dict):
            continue

        member_id = (
            member.get("member_id")
            or member.get("Member ID")
            or member.get("memberId")
            or member.get("id")
        )

        if not member_id:
            continue

        try:
            coverage = get_member_monthly_coverage(
                str(member_id).strip().upper(),
                selected_year,
                selected_month
            )
        except Exception as error:
            print(
                "[FINANCIAL REGISTER COVERAGE ERROR]",
                str(member_id),
                repr(error),
                flush=True
            )
            continue

        if not isinstance(coverage, dict):
            continue

        weeks = coverage.get("weeks") or []

        if not weeks:
            # Keep non-coverage transactions such as registration fees
            # or fines already supplied by the cash ledger.
            existing = member.get("transactions")

            if isinstance(existing, list) and existing:
                member["transaction_count"] = len(existing)
                total_transactions += len(existing)

            continue

        coverage_transactions = []

        for week in weeks:

            try:
                amount = float(
                    week.get("Allocated Amount") or 0
                )
            except (TypeError, ValueError):
                amount = 0.0

            coverage_week = week.get(
                "Coverage Week #"
            )

            week_start = week.get(
                "Coverage Week Start"
            ) or ""

            week_end = week.get(
                "Coverage Week End"
            ) or ""

            payment_date = week.get(
                "Payment Date"
            ) or ""

            receipt_number = week.get(
                "Receipt Number"
            ) or ""

            contribution_id = week.get(
                "Contribution ID"
            ) or ""

            coverage_id = week.get(
                "Coverage ID"
            ) or ""

            transaction = {
                # IMPORTANT:
                # The displayed transaction date is the coverage
                # week start, so October coverage appears under October.
                "date": week_start,

                "time": source_time_by_receipt.get(
                    str(receipt_number).strip().upper(),
                    ""
                ),

                "payment_type": "Weekly Contribution",

                "description": (
                    f"Contribution Coverage — "
                    f"Week {coverage_week}"
                    f" ({week_start} to {week_end})"
                ),

                "method": "Contribution Coverage",

                "amount": round(amount, 2),

                "receipt_number": receipt_number,

                "receipt_reference": receipt_number,

                "contribution_id": contribution_id,

                "coverage_id": coverage_id,

                "coverage_week": coverage_week,

                "coverage_week_start": week_start,

                "coverage_week_end": week_end,

                # This is the REAL cash payment date.
                "payment_date": payment_date,

                "source_payment_amount": (
                    week.get("Source Payment Amount") or 0
                ),

                "allocation_status": (
                    week.get("Allocation Status")
                    or "COVERED"
                ),

                "coverage_transaction": True,
            }

            coverage_transactions.append(
                transaction
            )

            monthly_coverage_rows.append({
                "member_id": str(member_id),
                "member_name": (
                    member.get("full_name")
                    or member.get("name")
                    or member.get("Full Name")
                    or week.get("Full Name")
                    or ""
                ),
                **week,
            })

            total_coverage_amount += amount
            total_coverage_weeks += 1
            total_coverage_transactions += 1

        # --------------------------------------------------------
        # Preserve fee/fine/other cash transactions.
        # Replace weekly-contribution cash rows with the coverage
        # rows for this selected month so they are not double-counted.
        # --------------------------------------------------------

        existing_transactions = member.get(
            "transactions"
        )

        if not isinstance(existing_transactions, list):
            existing_transactions = []

        non_weekly_transactions = []

        for transaction in existing_transactions:

            if not isinstance(transaction, dict):
                continue

            searchable = " ".join(
                str(
                    transaction.get(key) or ""
                )
                for key in (
                    "payment_type",
                    "transaction_type",
                    "description",
                    "type",
                )
            ).lower()

            if (
                "weekly contribution"
                in searchable
                or "weekly contribution" in searchable.replace("-", " ")
            ):
                continue

            non_weekly_transactions.append(
                transaction
            )

        member["transactions"] = (
            non_weekly_transactions
            + coverage_transactions
        )

        member["transaction_count"] = len(
            member["transactions"]
        )

        member["weekly_contributions"] = round(
            sum(
                float(
                    row.get("Allocated Amount") or 0
                )
                for row in weeks
            ),
            2
        )

        total_transactions += member[
            "transaction_count"
        ]

        if member["transaction_count"] > 0:
            members_with_transactions += 1

    # ------------------------------------------------------------
    # MONTHLY REPORT SUMMARY
    # ------------------------------------------------------------

    registration_fees = float(
        summary.get("registration_fees") or 0
    )

    fines = float(
        summary.get("fines") or 0
    )

    # Weekly contributions are now credited according to the
    # coverage weeks belonging to the requested month.
    summary["weekly_contributions"] = round(
        total_coverage_amount,
        2
    )

    summary["total_contributions"] = round(
        registration_fees
        + total_coverage_amount,
        2
    )

    summary["transactions"] = (
        total_transactions
    )

    summary["members_with_transactions"] = (
        members_with_transactions
    )

    # Coverage-specific fields are explicit so the distinction
    # between contribution coverage and actual cash is preserved.
    summary["coverage_total"] = round(
        total_coverage_amount,
        2
    )

    summary["coverage_week_count"] = (
        total_coverage_weeks
    )

    summary["coverage_transactions"] = (
        total_coverage_transactions
    )

    summary["cash_received_in_month"] = round(
        float(
            summary.get("total_money_in") or 0
        ),
        2
    )

    summary["cash_weekly_contributions_in_month"] = round(
        old_cash_weekly,
        2
    )


    # ------------------------------------------------------------
    # TLC OVERALL FUND POSITION
    #
    # Monthly filtering must NOT make the group's total funds
    # appear as zero merely because the selected month had no
    # new cash received.
    #
    # Example:
    # October contribution coverage = KSh 500
    # October new cash received    = KSh 0
    # TLC total funds              = overall current TLC funds
    # ------------------------------------------------------------

    try:
        # IMPORTANT:
        # The monthly ledger is intentionally coverage-based, so its
        # cash totals are period-specific. Overall TLC funds must come
        # from the complete financial register, not the October filter.

        from app.financial_register.service import (
            build_financial_register
        )

        all_time_register = build_financial_register()

        all_time_summary = (
            all_time_register.get("summary")
            or {}
        )
        # --------------------------------------------------------
        # LIFETIME MEMBER TOTALS
        #
        # The selected month controls the transaction rows and the
        # month's coverage amount, but each member's Total
        # Contributions must remain cumulative from the beginning.
        # --------------------------------------------------------

        all_time_members = (
            all_time_register.get("members")
            or []
        )

        lifetime_member_totals = {}

        for lifetime_member in all_time_members:

            if not isinstance(lifetime_member, dict):
                continue

            lifetime_member_id = (
                lifetime_member.get("member_id")
                or lifetime_member.get("Member ID")
                or lifetime_member.get("memberId")
                or lifetime_member.get("id")
            )

            if not lifetime_member_id:
                continue

            lifetime_total = lifetime_member.get(
                "total_contributions"
            )

            if lifetime_total is None:
                lifetime_total = (
                    lifetime_member.get("weekly_contributions")
                    or 0
                )

                lifetime_total += (
                    lifetime_member.get("registration_fees")
                    or 0
                )

            try:
                lifetime_total = float(
                    lifetime_total or 0
                )
            except (TypeError, ValueError):
                lifetime_total = 0.0

            lifetime_member_totals[
                str(lifetime_member_id).strip().upper()
            ] = round(
                lifetime_total,
                2
            )

        for current_member in members:

            if not isinstance(current_member, dict):
                continue

            current_member_id = (
                current_member.get("member_id")
                or current_member.get("Member ID")
                or current_member.get("memberId")
                or current_member.get("id")
            )

            if not current_member_id:
                continue

            lifetime_total = lifetime_member_totals.get(
                str(current_member_id).strip().upper()
            )

            if lifetime_total is not None:
                current_member["total_contributions"] = (
                    lifetime_total
                )

                current_member["lifetime_total_contributions"] = (
                    lifetime_total
                )


        overall_total_funds = float(
            all_time_summary.get("total_funds") or 0
        )

        # The financial register is the authoritative all-time money
        # position currently exposed by TLC.
        overall_total_money_in = float(
            all_time_summary.get("total_funds") or 0
        )

        overall_total_money_out = float(
            all_time_summary.get("total_money_out") or 0
        )

        overall_current_balance = float(
            all_time_summary.get("current_balance")
            or overall_total_funds - overall_total_money_out
        )

        # Preserve the overall TLC figures.
        summary["total_funds"] = round(
            overall_total_funds,
            2
        )

        summary["total_money_in"] = round(
            overall_total_money_in,
            2
        )

        summary["total_money_out"] = round(
            overall_total_money_out,
            2
        )

        summary["current_balance"] = round(
            overall_current_balance,
            2
        )

        # Explicit aliases for future UI/report/export use.
        summary["all_time_total_funds"] = round(
            overall_total_funds,
            2
        )

        summary["all_time_total_money_in"] = round(
            overall_total_money_in,
            2
        )

        summary["all_time_total_money_out"] = round(
            overall_total_money_out,
            2
        )

        summary["all_time_current_balance"] = round(
            overall_current_balance,
            2
        )

    except Exception as error:
        print(
            "[FINANCIAL REGISTER OVERALL FUNDS ERROR]",
            repr(error),
            flush=True
        )

    # A clear reporting basis for the UI/export layer.
    report["report_basis"] = (
        "Contribution coverage month"
    )

    report["coverage"] = {
        "year": selected_year,
        "month": selected_month,
        "month_label": (
            f"{selected_year}-{selected_month:02d}"
        ),
        "total": round(
            total_coverage_amount,
            2
        ),
        "week_count": total_coverage_weeks,
        "transaction_count": total_coverage_transactions,
        "rows": monthly_coverage_rows,
    }

    return report

