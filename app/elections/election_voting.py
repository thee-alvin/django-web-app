from pathlib import Path
from datetime import datetime
import uuid

from openpyxl import load_workbook

from flask import Blueprint, jsonify, request, session

from app.security.audit_log import record_activity


BASE_DIR = Path(__file__).resolve().parents[2]

ELECTIONS_FILE = (
    BASE_DIR
    / "data"
    / "spreadsheets"
    / "06_ELECTIONS.xlsx"
)

CANDIDATES_FILE = (
    BASE_DIR
    / "data"
    / "spreadsheets"
    / "07_CANDIDATES.xlsx"
)


election_voting_bp = Blueprint(
    "election_voting",
    __name__
)


POSITION_CODES = {
    "CHAIRPERSON": "TLC-POS-001",
    "VICE CHAIRPERSON": "TLC-POS-002",
    "SECRETARY": "TLC-POS-003",
    "TREASURER": "TLC-POS-004",
}


def clean(value):
    return str(value or "").strip()


def get_active_election(wb):
    ws = wb["Elections"]

    headers = [
        clean(cell.value)
        for cell in ws[1]
    ]

    for row in ws.iter_rows(
        min_row=2,
        values_only=True
    ):
        if not any(value is not None for value in row):
            continue

        record = {}

        for index, header in enumerate(headers):
            if not header:
                continue

            record[header] = (
                row[index]
                if index < len(row)
                else None
            )

        return record

    return None


def get_candidate_map():
    wb = load_workbook(
        CANDIDATES_FILE,
        read_only=True,
        data_only=True
    )

    try:
        ws = wb["Candidates"]

        rows = ws.iter_rows(
            values_only=True
        )

        headers = next(rows, None)

        if not headers:
            return {}

        headers = [
            clean(value)
            for value in headers
        ]

        result = {}

        for row in rows:

            if not any(
                value is not None
                for value in row
            ):
                continue

            record = {}

            for index, header in enumerate(headers):

                if not header:
                    continue

                record[header] = (
                    row[index]
                    if index < len(row)
                    else None
                )

            candidate_id = clean(
                record.get("Candidate ID")
            )

            if candidate_id:
                result[candidate_id] = record

        return result

    finally:
        wb.close()


def has_voted(ws, headers, member_id, election_id, position_id):

    member_column = headers.index(
        "Member ID"
    ) + 1

    election_column = headers.index(
        "Election ID"
    ) + 1

    position_column = headers.index(
        "Position ID"
    ) + 1

    for row in range(2, ws.max_row + 1):

        stored_member = clean(
            ws.cell(
                row=row,
                column=member_column
            ).value
        ).upper()

        stored_election = clean(
            ws.cell(
                row=row,
                column=election_column
            ).value
        ).upper()

        stored_position = clean(
            ws.cell(
                row=row,
                column=position_column
            ).value
        ).upper()

        if (
            stored_member == member_id.upper()
            and stored_election == election_id.upper()
            and stored_position == position_id.upper()
        ):
            return True

    return False


def submit_ballot(member_id, selections):

    if not member_id:
        return False, "Authentication required.", None

    if not isinstance(selections, dict):
        return False, "Invalid ballot.", None

    required_positions = list(
        POSITION_CODES.values()
    )

    if set(selections.keys()) != set(
        required_positions
    ):
        return (
            False,
            "A complete ballot must contain all four positions.",
            None
        )

    candidates = get_candidate_map()

    election_wb = load_workbook(
        ELECTIONS_FILE
    )

    try:

        election = get_active_election(
            election_wb
        )

        if not election:
            return (
                False,
                "No election is configured.",
                None
            )

        election_id = clean(
            election.get("Election ID")
        )

        status = clean(
            election.get("Status")
        ).upper()

        if status != "VOTING OPEN":
            return (
                False,
                "Voting is not currently open.",
                None
            )

        participation_ws = election_wb[
            "Voter Participation"
        ]

        participation_headers = [
            clean(cell.value)
            for cell in participation_ws[1]
        ]

        voting_ws = election_wb[
            "Voting Records"
        ]

        voting_headers = [
            clean(cell.value)
            for cell in voting_ws[1]
        ]

        # --------------------------------------------------------
        # Validate every position/candidate BEFORE writing anything.
        # --------------------------------------------------------

        validated = []

        for position_id in required_positions:

            candidate_id = clean(
                selections.get(position_id)
            )

            if not candidate_id:
                return (
                    False,
                    f"No candidate selected for {position_id}.",
                    None
                )

            candidate = candidates.get(
                candidate_id
            )

            if not candidate:
                return (
                    False,
                    "One or more selected candidates do not exist.",
                    None
                )

            candidate_election = clean(
                candidate.get("Election ID")
            )

            candidate_position = clean(
                candidate.get("Position ID")
            )

            candidate_status = clean(
                candidate.get("Candidate Status")
            ).upper()

            if candidate_election != election_id:
                return (
                    False,
                    "A selected candidate does not belong to this election.",
                    None
                )

            if candidate_position != position_id:
                return (
                    False,
                    "A selected candidate does not belong to the selected position.",
                    None
                )

            if candidate_status != "APPROVED":
                return (
                    False,
                    "One or more selected candidates are not approved.",
                    None
                )

            if has_voted(
                participation_ws,
                participation_headers,
                member_id,
                election_id,
                position_id
            ):
                return (
                    False,
                    f"You have already voted for {candidate_position}.",
                    None
                )

            validated.append(
                (
                    position_id,
                    candidate_id
                )
            )

        # --------------------------------------------------------
        # Create one ballot ID for the complete ballot.
        # --------------------------------------------------------

        ballot_id = (
            "TLC-BALLOT-"
            + uuid.uuid4().hex.upper()
        )

        submitted_at = datetime.now()

        # --------------------------------------------------------
        # Record participation separately.
        # --------------------------------------------------------

        for position_id, candidate_id in validated:

            participation_id = (
                "TLC-PART-"
                + uuid.uuid4().hex.upper()
            )

            participation_ws.append([
                participation_id,
                election_id,
                member_id,
                position_id,
                "YES",
            ])

        # --------------------------------------------------------
        # Record anonymous candidate selections.
        # No Member ID is stored in Voting Records.
        # --------------------------------------------------------

        for position_id, candidate_id in validated:

            vote_id = (
                "TLC-VOTE-"
                + uuid.uuid4().hex.upper()
            )

            voting_ws.append([
                vote_id,
                election_id,
                ballot_id,
                position_id,
                candidate_id,
                submitted_at,
                "VALID",
            ])

        # --------------------------------------------------------
        # Audit the completed ballot.
        # --------------------------------------------------------

        audit_ws = election_wb[
            "Election Audit"
        ]

        audit_headers = [
            clean(cell.value)
            for cell in audit_ws[1]
        ]

        audit_ws.append([
            "TLC-AUDIT-" + uuid.uuid4().hex.upper(),
            election_id,
            "BALLOT SUBMITTED",
            "A valid ballot containing all four positions was submitted.",
            "SYSTEM",
            submitted_at,
        ])

        election_wb.save(ELECTIONS_FILE)

        record_activity(
            member_id,
            action="Election Vote Submitted",
            description="Your TLC election ballot was recorded successfully.",
            category="election",
            details={
                "election_id": election_id,
                "ballot_id": ballot_id,
            }
        )

        return (
            True,
            "Your ballot has been recorded successfully.",
            ballot_id
        )

    finally:
        election_wb.close()


@election_voting_bp.route(
    "/api/member/elections/vote",
    methods=["POST"]
)
def cast_vote():

    member_id = clean(
        session.get("member_id")
    )

    if not member_id:
        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    data = request.get_json(
        silent=True
    ) or {}

    selections = data.get(
        "selections"
    )

    try:

        success, message, ballot_id = (
            submit_ballot(
                member_id,
                selections
            )
        )

        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 400

        return jsonify({
            "success": True,
            "message": message,
            "ballot_id": ballot_id
        })

    except Exception as error:

        print(
            "[ELECTION VOTING] ERROR:",
            repr(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Unable to record your ballot."
        }), 500


