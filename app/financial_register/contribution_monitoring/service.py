from datetime import date, datetime, timedelta

from ..ledger_service import build_financial_ledger


WEEKLY_AMOUNT = 100.0
CYCLE_START_DATE = date(2026, 9, 10)
DUE_WEEKDAY = 3  # Thursday


def _cycle_for_date(value):
    if not value:
        return None

    days_since_thursday = (
        value.weekday() - DUE_WEEKDAY
    ) % 7

    return (
        value
        - timedelta(days=days_since_thursday)
    )


def _most_recent_thursday():
    return _cycle_for_date(
        date.today()
    )


def _next_thursday(value):
    return value + timedelta(days=7)


def _parse_date(value):
    if not value:
        return None

    text = str(value).strip()

    try:
        return datetime.fromisoformat(
            text.replace("Z", "+00:00")
        ).date()
    except ValueError:
        pass

    try:
        return datetime.strptime(
            text[:10],
            "%Y-%m-%d"
        ).date()
    except ValueError:
        return None


def _payment_date(transaction):
    return _parse_date(
        transaction.get("date")
    )


def _weekly_transactions(member):
    return [
        transaction
        for transaction in member["transactions"]
        if str(
            transaction.get(
                "payment_type",
                ""
            )
        ).strip().upper()
        == "WEEKLY CONTRIBUTION"
    ]


def _total_paid(transactions):
    return sum(
        float(
            transaction.get(
                "amount",
                0
            ) or 0
        )
        for transaction in transactions
    )


def _cycle_paid_amount(
    total_paid,
    week_number
):
    amount_before_current_week = (
        (week_number - 1)
        * WEEKLY_AMOUNT
    )

    available_for_current = total_paid - amount_before_current_week

    if available_for_current <= 0:
        return 0.0

    return min(
        available_for_current,
        WEEKLY_AMOUNT
    )


def _cycle_status(
    total_paid,
    week_number,
    cycle_start
):
    paid_amount = _cycle_paid_amount(
        total_paid,
        week_number
    )

    balance = max(
        WEEKLY_AMOUNT - paid_amount,
        0.0
    )

    if paid_amount >= WEEKLY_AMOUNT:
        status = "PAID"

    elif paid_amount > 0:
        status = "PARTIAL"

    else:
        status = "UNPAID"

    return {
        "cycle_start":
            cycle_start.isoformat(),

        "cycle_end":
            _next_thursday(
                cycle_start
            ).isoformat(),

        "week_number":
            week_number,

        "expected_amount":
            WEEKLY_AMOUNT,

        "paid_amount":
            paid_amount,

        "balance":
            balance,

        "status":
            status,
    }


def build_contribution_monitoring(
    history_weeks=8
):
    ledger = build_financial_ledger()

    current_cycle = (
        _most_recent_thursday()
    )

    all_weekly_transactions = []

    for member in ledger["members"]:
        all_weekly_transactions.extend(
            _weekly_transactions(member)
        )

    payment_dates = [
        _payment_date(transaction)
        for transaction in
        all_weekly_transactions
    ]

    payment_dates = [
        value
        for value in payment_dates
        if value
    ]

    # TLC weekly cycle is officially anchored to
    # Thursday, 10 September 2026.
    group_start_cycle = CYCLE_START_DATE

    current_week_number = max(
        1,
        (
            (
                current_cycle
                - group_start_cycle
            ).days // 7
        ) + 1
    )

    history_count = max(
        1,
        min(12, int(history_weeks))
    )

    history_week_numbers = list(
        range(
            max(
                1,
                current_week_number
                - history_count
                + 1
            ),
            current_week_number + 1
        )
    )

    members = []

    for member in ledger["members"]:

        weekly_transactions = (
            _weekly_transactions(member)
        )

        total_weekly_paid = _total_paid(
            weekly_transactions
        )

        current_week = _cycle_status(
            total_weekly_paid,
            current_week_number,
            current_cycle
        )

        history = []

        for week_number in history_week_numbers:

            cycle_start = (
                group_start_cycle
                + timedelta(
                    days=7
                    * (week_number - 1)
                )
            )

            history.append(
                _cycle_status(
                    total_weekly_paid,
                    week_number,
                    cycle_start
                )
            )

        covered_weeks = int(
            total_weekly_paid
            // WEEKLY_AMOUNT
        )

        future_prepaid_amount = max(
            total_weekly_paid
            - (
                current_week_number
                * WEEKLY_AMOUNT
            ),
            0.0
        )

        latest_payment_date = None

        dates = [
            _payment_date(
                transaction
            )
            for transaction
            in weekly_transactions
        ]

        dates = [
            value
            for value in dates
            if value
        ]

        if dates:
            latest_payment_date = max(
                dates
            ).isoformat()

        members.append({

            "member_id":
                member["member_id"],

            "full_name":
                member["full_name"],

            "weekly_amount":
                WEEKLY_AMOUNT,

            "current_week":
                current_week,

            "history":
                history,

            "total_weekly_paid":
                total_weekly_paid,

            "weekly_transaction_count":
                len(
                    weekly_transactions
                ),

            "latest_payment_date":
                latest_payment_date,

            "covered_weeks":
                covered_weeks,

            "future_prepaid_amount":
                future_prepaid_amount,
        })

    members.sort(
        key=lambda item:
            item["member_id"]
    )

    total_members = len(
        members
    )

    paid_count = sum(
        1
        for member in members
        if member["current_week"]["status"]
        == "PAID"
    )

    partial_count = sum(
        1
        for member in members
        if member["current_week"]["status"]
        == "PARTIAL"
    )

    unpaid_count = sum(
        1
        for member in members
        if member["current_week"]["status"]
        == "UNPAID"
    )

    expected_amount = (
        total_members
        * WEEKLY_AMOUNT
    )

    paid_amount = sum(
        member["current_week"]["paid_amount"]
        for member in members
    )

    outstanding_amount = sum(
        member["current_week"]["balance"]
        for member in members
    )

    collection_rate = (
        (
            paid_amount
            / expected_amount
        ) * 100
        if expected_amount
        else 0.0
    )

    weekly_history = []

    for week_number in history_week_numbers:

        cycle_start = (
            group_start_cycle
            + timedelta(
                days=7
                * (week_number - 1)
            )
        )

        cycle_total = sum(
            _cycle_paid_amount(
                member["total_weekly_paid"],
                week_number
            )
            for member in members
        )

        weekly_history.append({

            "cycle_start":
                cycle_start.isoformat(),

            "cycle_end":
                _next_thursday(
                    cycle_start
                ).isoformat(),

            "week_number":
                week_number,

            "expected_amount":
                expected_amount,

            "paid_amount":
                cycle_total,

            "collection_rate":
                (
                    (
                        cycle_total
                        / expected_amount
                    ) * 100
                    if expected_amount
                    else 0.0
                ),
        })

    return {

        "generated_at":
            datetime.now().isoformat(
                timespec="seconds"
            ),

        "current_cycle": {

            "due_date":
                current_cycle.isoformat(),

            "next_due_date":
                _next_thursday(
                    current_cycle
                ).isoformat(),

            "week_number":
                current_week_number,

            "start_date":
                group_start_cycle.isoformat(),

            "weekly_amount":
                WEEKLY_AMOUNT,
        },

        "summary": {

            "total_members":
                total_members,

            "paid_count":
                paid_count,

            "partial_count":
                partial_count,

            "unpaid_count":
                unpaid_count,

            "expected_amount":
                expected_amount,

            "paid_amount":
                paid_amount,

            "outstanding_amount":
                outstanding_amount,

            "collection_rate":
                collection_rate,
        },

        "members":
            members,

        "weekly_history":
            weekly_history,
    }



