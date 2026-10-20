from flask import session


DEFAULT_ROLE = "MEMBER"


def start_member_session(member_id, role=DEFAULT_ROLE):
    """Store the authenticated TLC member and role in the current session."""
    session.clear()
    session["member_id"] = str(member_id).strip().upper()
    session["role"] = str(role or DEFAULT_ROLE).strip().upper()


def get_current_member_id():
    """Return the currently authenticated member ID."""
    return session.get("member_id")


def get_current_role():
    """Return the currently authenticated user's role."""
    return session.get("role", DEFAULT_ROLE)


def is_role(role):
    """Check whether the current session has the requested role."""
    return get_current_role() == str(role).strip().upper()


def end_member_session():
    """Clear the current TLC member session."""
    session.clear()
