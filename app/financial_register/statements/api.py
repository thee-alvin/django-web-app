from app.financial_register.contribution_coverage.service import get_member_monthly_coverage
from flask import Blueprint, jsonify, request, send_from_directory

from app.auth.session import get_current_member_id
from .service import build_member_statement


member_statement_api = Blueprint(
    "member_statement_api",
    __name__
)


@member_statement_api.after_request
def _attach_coverage_to_admin_statement(response):
    """Attach the existing TLC coverage ledger to admin statements."""

    if request.path != "/api/tlc/member-statement":
        return response

    try:
        payload = response.get_json(silent=True)

        if not isinstance(payload, dict):
            return response

        statement = payload.get("statement")

        if not isinstance(statement, dict):
            return response

        # The admin API already knows the selected member. Prefer
        # request arguments, then fall back to the returned statement.
        member_id = (
            request.args.get("member_id")
            or request.args.get("memberId")
            or request.args.get("member")
        )

        if not member_id:
            member = statement.get("member") or {}

            member_id = (
                member.get("member_id")
                or member.get("memberId")
                or member.get("Member ID")
                or member.get("id")
            )

        year = request.args.get("year")
        month = request.args.get("month")

        try:
            year_int = int(year)
            month_int = int(month)
        except (TypeError, ValueError):
            return response

        if not member_id or not 1 <= month_int <= 12:
            return response

        from app.financial_register.contribution_coverage.service import (
            get_member_monthly_coverage
        )

        coverage = get_member_monthly_coverage(
            str(member_id).strip().upper(),
            year_int,
            month_int
        )

        if not isinstance(coverage, dict):
            return response

        weeks = coverage.get("weeks") or []

        statement["coverage"] = coverage
        statement["coverageWeeks"] = weeks
        statement["coverageAmount"] = coverage.get("amount", 0)
        statement["coverageWeekCount"] = coverage.get(
            "week_count",
            len(weeks)
        )

        # --------------------------------------------------------
        # Find the original payment(s) that created this coverage.
        # They remain cash transactions dated on their real payment
        # date and are NOT converted into new cash in this month.
        # --------------------------------------------------------

        receipt_numbers = {
            str(row.get("Receipt Number")).strip().upper()
            for row in weeks
            if row.get("Receipt Number")
        }

        contribution_ids = {
            str(row.get("Contribution ID")).strip().upper()
            for row in weeks
            if row.get("Contribution ID")
        }

        try:
            from app.financial_register.statements.service import (
                build_member_statement
            )

            yearly = build_member_statement(
                member_id=str(member_id).strip().upper(),
                year=str(year_int),
                month=None
            )
        except Exception:
            yearly = None

        if isinstance(yearly, dict):

            yearly_member = yearly.get("member") or {}

            history = yearly_member.get("transactions")

            if not isinstance(history, list):
                history = yearly.get("transactions")

            if not isinstance(history, list):
                history = []

            def identities(tx):
                found = set()

                for key in (
                    "receipt",
                    "receipt_number",
                    "receiptNumber",
                    "Receipt Number",
                    "reference",
                    "payment_reference",
                    "paymentReference",
                    "contribution_id",
                    "contributionId",
                    "Contribution ID",
                ):
                    value = tx.get(key)

                    if value not in (None, ""):
                        found.add(
                            str(value).strip().upper()
                        )

                return found

            source_transactions = []

            for tx in history:

                if not isinstance(tx, dict):
                    continue

                ids = identities(tx)

                if (
                    ids.intersection(receipt_numbers)
                    or ids.intersection(contribution_ids)
                ):
                    source_transactions.append(tx)

            member = statement.setdefault("member", {})

            current = member.get("transactions")

            if not isinstance(current, list):
                current = []

            existing = set()

            for tx in current:
                if isinstance(tx, dict):
                    existing.update(identities(tx))

            for tx in source_transactions:

                ids = identities(tx)

                if not ids.intersection(existing):
                    current.append(tx)
                    existing.update(ids)

            member["transactions"] = current
            statement["transactions"] = current
            statement["coverage_source_transactions"] = source_transactions

        payload["statement"] = statement
        response.set_json(payload)

    except Exception as exc:
        print(
            "[ADMIN MEMBER STATEMENT COVERAGE]",
            repr(exc),
            flush=True
        )

    return response

ADMIN_MEMBER_ID = "TLC/001/2026"


def _is_authorized():
    return (
        str(
            get_current_member_id() or ""
        ).strip().upper()
        == ADMIN_MEMBER_ID
    )


def _clean(value):
    return str(value or "").strip()


@member_statement_api.get(
    "/api/tlc/member-statement"
)
def member_statement():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    member_id = _clean(
        request.args.get("member_id")
    )

    year = _clean(
        request.args.get("year")
    )

    month = _clean(
        request.args.get("month")
    )

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Member ID is required."
        }), 400

    if year and (
        not year.isdigit()
        or len(year) != 4
    ):
        return jsonify({
            "success": False,
            "message": "Invalid year."
        }), 400

    if month:

        if not year:
            return jsonify({
                "success": False,
                "message": (
                    "A month requires a year."
                )
            }), 400

        if (
            not month.isdigit()
            or not 1 <= int(month) <= 12
        ):
            return jsonify({
                "success": False,
                "message": "Invalid month."
            }), 400

        month = str(
            int(month)
        ).zfill(2)

    try:

        statement = build_member_statement(
            member_id=member_id,
            year=year or None,
            month=month or None,
        )

        # ADMIN DIRECT COVERAGE PATCH
        if year and month:
            try:
                coverage = get_member_monthly_coverage(
                    member_id,
                    int(year),
                    int(month)
                )
            except Exception as coverage_error:
                print(
                    "[ADMIN COVERAGE ERROR]",
                    repr(coverage_error),
                    flush=True
                )
                coverage = None
        else:
            coverage = None

        if isinstance(coverage, dict):
            weeks = coverage.get("weeks") or []

            statement["coverage"] = coverage
            statement["coverageWeeks"] = weeks
            statement["coverageAmount"] = coverage.get("amount", 0)
            statement["coverageWeekCount"] = coverage.get(
                "week_count",
                len(weeks)
            )

            # Bring the original source payment into the statement
            # history without changing the selected month's cash totals.
            try:
                yearly_statement = build_member_statement(
                    member_id=member_id,
                    year=year,
                    month=None
                )
            except Exception:
                yearly_statement = None

            if isinstance(yearly_statement, dict) and weeks:

                source_receipts = {
                    str(row.get("Receipt Number")).strip().upper()
                    for row in weeks
                    if row.get("Receipt Number")
                }

                source_contributions = {
                    str(row.get("Contribution ID")).strip().upper()
                    for row in weeks
                    if row.get("Contribution ID")
                }

                year_member = yearly_statement.get("member") or {}
                history = year_member.get("transactions")

                if not isinstance(history, list):
                    history = yearly_statement.get("transactions")

                if not isinstance(history, list):
                    history = []

                def _tx_ids(tx):
                    found = set()

                    for key in (
                        "receipt",
                        "receipt_number",
                        "receiptNumber",
                        "Receipt Number",
                        "reference",
                        "payment_reference",
                        "paymentReference",
                        "contribution_id",
                        "contributionId",
                        "Contribution ID",
                    ):
                        value = tx.get(key)
                        if value not in (None, ""):
                            found.add(str(value).strip().upper())

                    return found

                source_transactions = []

                for tx in history:
                    if not isinstance(tx, dict):
                        continue

                    ids = _tx_ids(tx)

                    if (
                        ids.intersection(source_receipts)
                        or ids.intersection(source_contributions)
                    ):
                        source_transactions.append(tx)

                member_block = statement.setdefault("member", {})
                current_transactions = member_block.get("transactions")

                if not isinstance(current_transactions, list):
                    current_transactions = []

                existing_ids = set()

                for tx in current_transactions:
                    if isinstance(tx, dict):
                        existing_ids.update(_tx_ids(tx))

                for tx in source_transactions:
                    ids = _tx_ids(tx)

                    if not ids.intersection(existing_ids):
                        current_transactions.append(tx)
                        existing_ids.update(ids)

                member_block["transactions"] = current_transactions
                statement["transactions"] = current_transactions
                statement["coverage_source_transactions"] = source_transactions

        if statement is None:
            return jsonify({
                "success": False,
                "message": "Member was not found."
            }), 404

        return jsonify({
            "success": True,
            "statement": statement,
        })

    except ValueError as error:

        return jsonify({
            "success": False,
            "message": str(error),
        }), 400

    except Exception:

        return jsonify({
            "success": False,
            "message": (
                "Unable to build the member statement."
            ),
        }), 500


@member_statement_api.get(
    "/tlc-member-statements"
)
def member_statement_page():

    if not _is_authorized():
        return jsonify({
            "success": False,
            "message": "Access denied."
        }), 403

    return send_from_directory(
        "frontend/pages",
        "tlc_member_statements.html"
    )
