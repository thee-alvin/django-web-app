from __future__ import annotations

import re
from calendar import month_name
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from app.auth.session import get_current_member_id
from app.financial_register.statements.service import build_member_statement


member_payment_statement_api = Blueprint(
    "member_payment_statement_api",
    __name__
)


def _clean(value):
    return str(value or "").strip()


def _number(value):
    if value is None:
        return 0.0

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).replace(",", "")
    match = re.search(r"-?\d+(?:\.\d+)?", text)

    return float(match.group()) if match else 0.0


def _parse_date(value):
    if isinstance(value, datetime):
        return value.date()

    if hasattr(value, "year") and hasattr(value, "month") and hasattr(value, "day"):
        try:
            return value
        except Exception:
            pass

    text = _clean(value)

    if not text:
        return None

    formats = (
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%d %B %Y",
        "%d %b %Y",
        "%B %d, %Y",
        "%b %d, %Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
    )

    for fmt in formats:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue

    match = re.search(
        r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})",
        text
    )

    if match:
        try:
            return datetime.strptime(
                match.group(0),
                "%d %B %Y"
            ).date()
        except ValueError:
            try:
                return datetime.strptime(
                    match.group(0),
                    "%d %b %Y"
                ).date()
            except ValueError:
                pass

    return None


def _transaction_date(transaction):
    for key in (
        "date",
        "payment_date",
        "transaction_date",
        "received_date",
        "created_at",
        "received_at",
    ):
        if key in transaction:
            parsed = _parse_date(transaction.get(key))
            if parsed:
                return parsed

    return None


def _transaction_text(transaction):
    parts = []

    for key in (
        "description",
        "payment_type",
        "type",
        "transaction_type",
        "details",
        "notes",
        "remarks",
    ):
        value = transaction.get(key)

        if value:
            parts.append(str(value))

    return " ".join(parts)


def _extract_week_count(transaction):
    for key in (
        "weeks",
        "week_count",
        "coverage_weeks",
        "number_of_weeks",
    ):
        value = transaction.get(key)

        if value is not None:
            try:
                count = int(float(str(value).strip()))
                if count > 0:
                    return count
            except (TypeError, ValueError):
                pass

    text = _transaction_text(transaction)

    match = re.search(
        r"(\d+)\s*[- ]?\s*WEEKS?",
        text,
        flags=re.IGNORECASE
    )

    if match:
        return int(match.group(1))

    return 0


def _extract_transactions(statement):
    member = statement.get("member") or {}

    transactions = member.get("transactions")

    if isinstance(transactions, list):
        return transactions

    transactions = statement.get("transactions")

    if isinstance(transactions, list):
        return transactions

    return []


def _build_coverage(all_year_statement, year, month):
    if not year or not month:
        return {
            "year": None,
            "month": None,
            "month_label": "",
            "period": "",
            "amount": 0.0,
            "week_count": 0,
            "weeks_catered_for": 0,
            "weeks": [],
            "coverageWeeks": [],
            "coverageAmount": 0.0,
            "coverageWeekCount": 0,
        }

    target_year = int(year)
    target_month = int(month)

    transactions = _extract_transactions(all_year_statement)

    coverage_rows = []

    for transaction in transactions:
        if not isinstance(transaction, dict):
            continue

        payment_date = _transaction_date(transaction)

        if not payment_date:
            continue

        if payment_date.year != target_year and payment_date.year != target_year - 1:
            continue

        week_count = _extract_week_count(transaction)

        if week_count <= 0:
            continue

        total_amount = _number(
            transaction.get("amount")
            or transaction.get("amount_paid")
            or transaction.get("paid_amount")
            or transaction.get("value")
        )

        if total_amount <= 0:
            continue

        weekly_amount = total_amount / week_count

        for index in range(week_count):
            covered_date = payment_date + timedelta(weeks=index)

            if (
                covered_date.year == target_year
                and covered_date.month == target_month
            ):
                coverage_rows.append({
                    "week": index + 1,
                    "week_number": index + 1,
                    "label": f"WEEK {index + 1}",
                    "date": covered_date.strftime("%d %B %Y"),
                    "coverage_date": covered_date.strftime("%d %B %Y"),
                    "payment_received": payment_date.strftime("%d %B %Y"),
                    "payment_received_date": payment_date.strftime("%d %B %Y"),
                    "amount": round(weekly_amount, 2),
                    "description": (
                        f"Payment received "
                        f"{payment_date.strftime('%d %B %Y')}"
                    ),
                    "source_amount": round(total_amount, 2),
                    "source_week_count": week_count,
                })

    coverage_rows.sort(
        key=lambda row: _parse_date(row["coverage_date"]) or datetime.min.date()
    )

    monthly_amount = round(
        sum(row["amount"] for row in coverage_rows),
        2
    )

    week_count = len(coverage_rows)

    month_label = f"{target_year}-{target_month:02d}"

    return {
        "year": target_year,
        "month": target_month,
        "month_label": month_label,
        "period": month_label,
        "amount": monthly_amount,
        "coverageAmount": monthly_amount,
        "week_count": week_count,
        "coverageWeekCount": week_count,
        "weeks_catered_for": week_count,
        "weeks": coverage_rows,
        "coverageWeeks": coverage_rows,
    }


@member_payment_statement_api.get(
    "/api/member/payment-statement"
)
def member_payment_statement():

    member_id = _clean(
        get_current_member_id()
    ).upper()

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Please log in to view your payment statement."
        }), 401

    year = _clean(
        request.args.get("year")
    )

    month = _clean(
        request.args.get("month")
    )

    if year:
        if not year.isdigit() or len(year) != 4:
            return jsonify({
                "success": False,
                "message": "Invalid year."
            }), 400

    if month:
        if not year:
            return jsonify({
                "success": False,
                "message": "A month requires a year."
            }), 400

        if not month.isdigit() or not 1 <= int(month) <= 12:
            return jsonify({
                "success": False,
                "message": "Invalid month."
            }), 400

        month = str(int(month)).zfill(2)

    try:

        statement = build_member_statement(
            member_id=member_id,
            year=year or None,
            month=month or None
        )

        if statement is None:
            return jsonify({
                "success": False,
                "message": "Your member statement was not found."
            }), 404

        history_statement = (
            build_member_statement(
                member_id=member_id,
                year=year,
                month=None
            )
            if year and month
            else statement
        )

        coverage = _build_coverage(
            all_year_statement=history_statement,
            year=year,
            month=month
        )

        # Keep October/November cash totals separate from coverage,
        # but show the original payment that created the coverage.
        if year and month and coverage.get("weeks"):
            covered_dates = {
                _parse_date(row.get("coverage_date"))
                for row in coverage["weeks"]
            }
            covered_dates.discard(None)

            source_transactions = []

            for transaction in _extract_transactions(history_statement):
                payment_date = _transaction_date(transaction)

                if not payment_date:
                    continue

                week_count = _extract_week_count(transaction)

                if week_count <= 0:
                    continue

                coverage_end = (
                    payment_date
                    + timedelta(weeks=week_count)
                    - timedelta(days=1)
                )

                overlaps = any(
                    payment_date <= covered_date <= coverage_end
                    for covered_date in covered_dates
                )

                if overlaps:
                    source_transactions.append(transaction)

            member = statement.setdefault("member", {})
            current_transactions = member.get("transactions")

            if not isinstance(current_transactions, list):
                current_transactions = []

            def transaction_key(transaction):
                return (
                    _clean(
                        transaction.get("receipt")
                        or transaction.get("receipt_number")
                        or transaction.get("reference")
                        or transaction.get("payment_reference")
                    ),
                    str(_transaction_date(transaction) or ""),
                    round(
                        _number(
                            transaction.get("amount")
                            or transaction.get("amount_paid")
                            or transaction.get("paid_amount")
                            or transaction.get("value")
                        ),
                        2
                    ),
                    _transaction_text(transaction),
                )

            existing_keys = {
                transaction_key(transaction)
                for transaction in current_transactions
            }

            for transaction in source_transactions:
                key = transaction_key(transaction)

                if key not in existing_keys:
                    current_transactions.append(transaction)
                    existing_keys.add(key)

            current_transactions.sort(
                key=lambda transaction: (
                    _transaction_date(transaction)
                    or datetime.min.date()
                ),
                reverse=True
            )

            member["transactions"] = current_transactions

        statement["coverage"] = coverage

        # Compatibility aliases for the existing frontend.
        statement["coverageWeeks"] = coverage["coverageWeeks"]
        statement["coverageAmount"] = coverage["coverageAmount"]
        statement["coverageWeekCount"] = coverage["coverageWeekCount"]

        return jsonify({
            "success": True,
            "statement": statement
        })

    except ValueError as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except Exception as error:

        print(
            "[MEMBER PAYMENT STATEMENT ERROR]",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Unable to load your payment statement."
        }), 500
