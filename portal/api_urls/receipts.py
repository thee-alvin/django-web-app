from django.urls import path

from portal.api_views import receipts


urlpatterns = [
    path("api/receipts/record", receipts.record_receipt, name="record-receipt"),
    path("api/member/receipts", receipts.get_member_receipts, name="member-receipts"),
    path("api/member/receipt/<path:receipt_number>", receipts.get_member_receipt, name="member-receipt"),
    path("api/receipt/qr", receipts.receipt_qr, name="receipt-qr"),
    path("api/member/documents", receipts.documents_list, name="member-documents"),
    path("api/member/documents/<str:document_id>", receipts.document_details, name="member-document-details"),
    path("api/member/documents/files/<path:file_name>", receipts.document_file, name="member-document-file"),
    path("api/member/constitution", receipts.constitution_info, name="member-constitution"),
    path("api/member/constitution/text", receipts.constitution_text, name="member-constitution-text"),
    path("api/member/constitution/download", receipts.download_constitution, name="member-constitution-download"),
    path("api/member/constitution/print", receipts.print_constitution, name="member-constitution-print"),
    path("api/tlc/search-receipts", receipts.search_receipts, name="search-receipts"),
    path("member/receipts", receipts.receipts_page, name="receipts-page"),
    path("member/receipt/<path:receipt_number>", receipts.receipt_details_page, name="receipt-details-page"),
]
