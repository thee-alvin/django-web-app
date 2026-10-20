from pathlib import Path
from tempfile import TemporaryDirectory

from django.conf import settings
from django.test import Client, SimpleTestCase, override_settings
from unittest.mock import patch

from django.test import override_settings
from django.urls import resolve

from app.config.data_paths import DATA_DIR
from portal.api_urls.receipts import urlpatterns as receipt_urlpatterns
from portal.api_views import finance, receipts


class PortalPageTests(SimpleTestCase):
    def test_home_renders_the_existing_portal_theme(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "THE LEGACY CIRCLE")
        self.assertContains(response, "/css/main.css")

    def test_every_copied_html_page_renders(self):
        templates_root = Path(settings.BASE_DIR) / "templates" / "portal" / "pages"
        for template in templates_root.rglob("*.html"):
            route_path = template.relative_to(templates_root).with_suffix("").as_posix()
            with self.subTest(path=route_path):
                response = self.client.get(f"/{route_path}")
                self.assertEqual(response.status_code, 200)

    def test_data_paths_follow_the_configured_mount(self):
        self.assertEqual(DATA_DIR, settings.TLC_DATA_DIR)

    def test_profile_picture_route_serves_from_configured_media_directory(self):
        with TemporaryDirectory() as media_dir:
            picture = Path(media_dir) / "TLC_001.jpg"
            picture.write_bytes(b"test-image")
            with override_settings(TLC_PROFILE_PICTURE_DIR=media_dir):
                response = self.client.get(
                    "/media/profile_pictures/TLC_001.jpg"
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    b"".join(response.streaming_content),
                    b"test-image",
                )
                response.close()

    def test_page_sets_csrf_cookie_for_ajax_mutations(self):
        client = Client(enforce_csrf_checks=True)
        response = client.get("/login")

        self.assertEqual(response.status_code, 200)
        csrf_token = response.cookies["csrftoken"].value
        self.assertContains(response, "/static/js/csrf.js")

        rejected = client.post(
            "/api/login",
            data="{}",
            content_type="application/json",
        )
        self.assertEqual(rejected.status_code, 403)

        accepted = client.post(
            "/api/login",
            data="{}",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(accepted.status_code, 400)

    def test_status_endpoint_returns_expected_payload(self):
        response = self.client.get("/api/status")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "system": "The Legacy Circle",
                "short_name": "TLC",
                "status": "online",
            },
        )


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
            "api/tlc/search-receipts": "search-receipts",
            "member/receipts": "receipts-page",
            "member/receipt/<path:receipt_number>": "receipt-details-page",
        }
        self.assertEqual(
            {str(pattern.pattern): pattern.name for pattern in receipt_urlpatterns},
            expected,
        )
        sample_paths = {
            "api/receipts/record": "/api/receipts/record",
            "api/member/receipts": "/api/member/receipts",
            "api/member/receipt/<path:receipt_number>": "/api/member/receipt/TLC/RCPT/2026/000001",
            "api/receipt/qr": "/api/receipt/qr",
            "api/member/documents": "/api/member/documents",
            "api/member/documents/<str:document_id>": "/api/member/documents/DOC-1",
            "api/member/documents/files/<path:file_name>": "/api/member/documents/files/TLC_Constitution.pdf",
            "api/member/constitution": "/api/member/constitution",
            "api/member/constitution/text": "/api/member/constitution/text",
            "api/member/constitution/download": "/api/member/constitution/download",
            "api/member/constitution/print": "/api/member/constitution/print",
            "api/tlc/search-receipts": "/api/tlc/search-receipts",
            "member/receipts": "/member/receipts",
            "member/receipt/<path:receipt_number>": "/member/receipt/TLC/RCPT/2026/000001",
        }
        with override_settings(ROOT_URLCONF="portal.api_urls.receipts"):
            for route, path in sample_paths.items():
                with self.subTest(path=path):
                    self.assertEqual(resolve(path).url_name, expected[route])

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
    def test_receipt_search_requires_financial_admin(self):
        response = self.client.get("/api/tlc/search-receipts?q=123")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["message"], "Access denied.")

    def test_finance_verification_routes_are_the_root_routes(self):
        self.assertEqual(resolve("/api/tlc/verify-receipt").func, finance.verify_receipt)
        self.assertEqual(resolve("/api/tlc/receipt-options").func, finance.receipt_options)
        self.assertEqual(
            resolve("/tlc-receipt-verification").func,
            finance.receipt_verification_page,
        )

    @override_settings(ROOT_URLCONF="portal.api_urls.receipts")
    def test_constitution_text_api_preserves_success_payload(self):
        with (
            override_settings(TLC_DATA_DIR="configured-data-dir"),
            patch.object(
                receipts,
                "_constitution_text",
                return_value="TLC Constitution",
            ),
        ):
            response = self.client.get("/api/member/constitution/text")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"success": True, "text": "TLC Constitution"},
        )
