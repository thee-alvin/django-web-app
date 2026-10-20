from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[2]

ACTIVITY_DIR = BASE_DIR / "data" / "activity"
ACTIVITY_FILE = ACTIVITY_DIR / "recent_activity.json"

MAX_ACTIVITY_RECORDS = 2000

_file_lock = threading.Lock()


def _ensure_storage():
    ACTIVITY_DIR.mkdir(parents=True, exist_ok=True)

    if not ACTIVITY_FILE.exists():
        ACTIVITY_FILE.write_text(
            "[]",
            encoding="utf-8"
        )


def _read_records() -> list[dict[str, Any]]:
    _ensure_storage()

    try:
        raw = ACTIVITY_FILE.read_text(
            encoding="utf-8"
        )

        data = json.loads(raw)

        if isinstance(data, list):
            return [
                item
                for item in data
                if isinstance(item, dict)
            ]

    except (
        OSError,
        json.JSONDecodeError,
        TypeError,
        ValueError
    ):
        pass

    return []


def _write_records(records: list[dict[str, Any]]):
    _ensure_storage()

    temporary_file = ACTIVITY_FILE.with_suffix(
        ".tmp"
    )

    temporary_file.write_text(
        json.dumps(
            records,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )

    temporary_file.replace(
        ACTIVITY_FILE
    )


def _normalise_member_id(member_id: Any) -> str:
    return str(
        member_id or ""
    ).strip().upper()


def _normalise_text(value: Any, fallback: str = "") -> str:
    text = str(
        value or ""
    ).strip()

    return text or fallback


def _safe_details(details: Any) -> dict[str, Any]:
    if not isinstance(details, dict):
        return {}

    safe = {}

    for key, value in details.items():

        key_text = _normalise_text(key)

        if not key_text:
            continue

        if isinstance(
            value,
            (
                str,
                int,
                float,
                bool
            )
        ) or value is None:

            safe[key_text] = value

        else:

            safe[key_text] = str(value)

    return safe


def record_activity(
    member_id: Any,
    action: Any,
    description: Any,
    category: Any = "system",
    details: Any = None
) -> dict[str, Any] | None:

    member_id = _normalise_member_id(
        member_id
    )

    if not member_id:
        return None

    action = _normalise_text(
        action,
        "activity"
    )

    description = _normalise_text(
        description,
        "TLC account activity"
    )

    category = _normalise_text(
        category,
        "system"
    ).lower()

    timestamp = datetime.now(
        timezone.utc
    ).isoformat()

    record = {
        "id": uuid.uuid4().hex,
        "member_id": member_id,
        "action": action,
        "description": description,
        "category": category,
        "timestamp": timestamp,
        "details": _safe_details(details)
    }

    with _file_lock:

        records = _read_records()

        records.append(record)

        if len(records) > MAX_ACTIVITY_RECORDS:
            records = records[
                -MAX_ACTIVITY_RECORDS:
            ]

        _write_records(records)

    return record


def get_member_activity(
    member_id: Any,
    limit: int = 50
) -> list[dict[str, Any]]:

    member_id = _normalise_member_id(
        member_id
    )

    if not member_id:
        return []

    try:
        limit = int(limit)
    except (
        TypeError,
        ValueError
    ):
        limit = 50

    limit = max(
        1,
        min(
            limit,
            100
        )
    )

    with _file_lock:

        records = _read_records()

    member_records = [
        record
        for record in records
        if _normalise_member_id(
            record.get("member_id")
        ) == member_id
    ]

    member_records.sort(
        key=lambda item:
            str(
                item.get(
                    "timestamp",
                    ""
                )
            ),
        reverse=True
    )

    return member_records[:limit]
