from pathlib import Path
from flask import Blueprint, jsonify, send_file
from app.auth.session import get_current_member_id
from app.security.audit_log import record_activity
from app.documents.document_service import get_documents, get_document
from app.config.data_paths import DATA_DIR

BASE_DIR = Path(__file__).resolve().parents[2]
DOCUMENTS_DIR = DATA_DIR / "documents"

documents_bp = Blueprint(
    "documents",
    __name__,
    url_prefix="/api/member/documents"
)


@documents_bp.route("", methods=["GET"])
def documents_list():
    return jsonify({
        "success": True,
        "documents": get_documents()
    })


@documents_bp.route("/<document_id>", methods=["GET"])
def document_details(document_id):
    document = get_document(document_id)

    if not document:
        return jsonify({
            "success": False,
            "message": "Document not found."
        }), 404

    return jsonify({
        "success": True,
        "document": document
    })


@documents_bp.route("/files/<path:file_name>", methods=["GET"])
def document_file(file_name):
    documents = get_documents()

    allowed = any(
        str(doc.get("file_name", "")).strip() == file_name.strip()
        for doc in documents
    )

    if not allowed:
        return jsonify({
            "success": False,
            "message": "Document file not found."
        }), 404

    file_path = DOCUMENTS_DIR / file_name

    if not file_path.exists() or not file_path.is_file():
        return jsonify({
            "success": False,
            "message": "Document file is unavailable."
        }), 404

    member_id = get_current_member_id()

    if member_id:
        record_activity(
            member_id,
            action="Document Accessed",
            description=(
                f"Opened the TLC document "
                f"'{file_name}'."
            ),
            category="document",
            details={
                "document_id": document_id if "document_id" in locals() else "",
                "file_name": file_name,
            }
        )

    return send_file(file_path, as_attachment=False)

