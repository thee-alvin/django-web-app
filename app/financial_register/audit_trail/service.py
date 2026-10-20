from datetime import datetime

from app.security.audit_log import (
    _read_records,
)


FINANCIAL_CATEGORIES = {
    "receipt",
    "receipts",
    "contribution",
    "contributions",
    "payment",
    "finance",
    "financial",
    "treasury",
}


FINANCIAL_KEYWORDS = (
    "receipt",
    "contribution",
    "payment",
    "fine",
    "registration",
    "weekly",
    "treasury",
    "financial",
)


def _is_financial(record):
    category = str(
        record.get(
            "category",
            ""
        )
    ).strip().lower()

    if category in FINANCIAL_CATEGORIES:
        return True

    action = str(
        record.get(
            "action",
            ""
        )
    ).strip().lower()

    description = str(
        record.get(
            "description",
            ""
        )
    ).strip().lower()

    text = f"{action} {description}"

    return any(
        keyword in text
        for keyword in FINANCIAL_KEYWORDS
    )


def _normalise_record(record):
    details = record.get(
        "details"
    )

    if not isinstance(
        details,
        dict
    ):
        details = {}

    return {
        "id":
            str(
                record.get(
                    "id",
                    ""
                )
            ),

        "member_id":
            str(
                record.get(
                    "member_id",
                    ""
                )
            ).strip().upper(),

        "action":
            str(
                record.get(
                    "action",
                    ""
                )
            ),

        "description":
            str(
                record.get(
                    "description",
                    ""
                )
            ),

        "category":
            str(
                record.get(
                    "category",
                    ""
                )
            ),

        "timestamp":
            str(
                record.get(
                    "timestamp",
                    ""
                )
            ),

        "details":
            details,
    }


def build_financial_audit_trail(
    limit=200
):
    try:
        limit = int(limit)
    except (
        TypeError,
        ValueError
    ):
        limit = 200

    limit = max(
        1,
        min(
            limit,
            500
        )
    )

    records = _read_records()

    financial_records = [
        _normalise_record(record)
        for record in records
        if _is_financial(record)
    ]

    financial_records.sort(
        key=lambda item:
            item.get(
                "timestamp",
                ""
            ),
        reverse=True
    )

    return {
        "generated_at":
            datetime.now().isoformat(
                timespec="seconds"
            ),

        "total_records":
            len(financial_records),

        "records":
            financial_records[:limit],
    }

def clear_financial_audit_trail():
    from app.security.audit_log import (
        _read_records,
        _write_records,
    )

    records = _read_records()

    # Preserve non-financial TLC activity.
    remaining_records = [
        record
        for record in records
        if not _is_financial(record)
    ]

    _write_records(
        remaining_records
    )

    return {
        "success": True,
        "total_records": 0,
    }
