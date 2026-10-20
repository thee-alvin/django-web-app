from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from django.urls import resolve

from portal.api_urls.receipts import urlpatterns
from portal.api_views import receipts


class ReceiptRouteTests(SimpleTestCase):
    def test_urlconf_registers_all_receipt_and_document_routes(self):
        expected = {
            "api/receipts/record": "record-receipt",
            "api/member/receipts": "member-receipts",
            "api/member/receipt/<path:receipt_number>": "member-receipt",
            "api/receipt/qr": "receipt-qr",
            "api/member/documents": "member-documents",
            "api/member/documents/<str:document_id>": "member-document-details",
            "api/member/documents/files/<path:file_name>": "member-document-file",
            "api/member/constitution": "member-constitution",
            "api/member/constitution/text": "member-constitution-text",
            "api/member/constitution/download": "member-constitution-download",
            "api/member/constitution/print": "member-constitution-print",
            "api/tlc/verify-receipt": "verify-receipt",
            "api/tlc/search-receipts": "search-receipts",
            "api/tlc/receipt-options": "receipt-options",
            "member/receipts": "receipts-page",
            "member/receipt/<path:receipt_number>": "receipt-details-page",
            "tlc-receipt-verification": "receipt-verification-page",
        }
        self.assertEqual(
            {str(pattern.pattern): pattern.name for pattern in urlpatterns},
            expected,
        )

    @override_settings(ROOT_URLCONF="portal.api_urls.receipts")
    def test_member_receipt_api_is_resolvable_and_requires_login(self):
        match = resolve("/api/member/receipts")
        self.assertEqual(match.func, receipts.get_member_receipts)
        response = self.client.get("/api/member/receipts")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(),
            {
                "success": False,
                "message": "Please log in to view your receipts.",
            },
        )

    @override_settings(ROOT_URLCONF="portal.api_urls.receipts")
    def test_verification_endpoints_and_page_require_financial_admin(self):
        for path in (
            "/api/tlc/verify-receipt",
            "/api/tlc/search-receipts?q=123",
            "/api/tlc/receipt-options",
            "/tlc-receipt-verification",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 403)
                self.assertEqual(response.json()["message"], "Access denied.")

    @override_settings(ROOT_URLCONF="portal.api_urls.receipts")
    def test_constitution_text_api_uses_tlc_data_dir(self):
        with (
            override_settings(TLC_DATA_DIR="configured-data-dir"),
            patch.object(receipts, "_constitution_text", return_value="TLC Constitution"),
        ):
            response = self.client.get("/api/member/constitution/text")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"success": True, "text": "TLC Constitution"},
        )
