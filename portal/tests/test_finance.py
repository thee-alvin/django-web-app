import json
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase

from portal.api_urls.finance import urlpatterns
from portal.api_views import finance


class FinanceApiTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def request(self, path, member_id=None, **query):
        request = self.factory.get(path, query)
        request.session = {}
        if member_id is not None:
            request.session["member_id"] = member_id
        return request

    def test_finance_urlconf_contains_all_expected_routes(self):
        self.assertEqual(
            [str(pattern.pattern) for pattern in urlpatterns],
            [
                "api/member/contributions",
                "api/member/financial-summary",
                "api/tlc/financial-register",
                "tlc-financial-register",
                "api/tlc/financial-register/excel",
                "api/tlc/financial-register/pdf",
                "api/tlc/member-statement",
                "tlc-member-statements",
                "api/tlc/verify-receipt",
                "api/tlc/receipt-options",
                "tlc-receipt-verification",
                "api/tlc/financial-reconciliation",
                "tlc-financial-reconciliation",
                "api/tlc/fines-register",
                "tlc-fines-register",
                "api/tlc/contribution-monitoring",
                "tlc-contribution-monitoring",
                "api/tlc/financial-audit-trail",
                "api/tlc/financial-audit-trail/reset",
                "tlc-financial-audit-trail",
                "api/tlc/disbursements",
                "tlc-disbursements",
            ],
        )
        self.assertEqual(
            urlpatterns[1].callback,
            finance.financial_register,
        )

    def test_member_contributions_requires_a_session_member(self):
        response = finance.member_contributions(
            self.request("/api/member/contributions")
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            json.loads(response.content),
            {"success": False, "message": "You must be logged in."},
        )

    def test_member_contributions_preserves_success_payload(self):
        sample = [
            {
                "contribution_id": "C-1",
                "payment_date": "2026-10-01",
                "payment_time": "10:00:00",
                "amount": 120.0,
                "status": "APPROVED",
            }
        ]
        with patch.object(finance, "_read_member_contributions", return_value=sample):
            response = finance.member_contributions(
                self.request("/api/member/contributions", "TLC/002/2026")
            )

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertTrue(payload["success"])
        self.assertEqual(payload["member_id"], "TLC/002/2026")
        self.assertEqual(payload["contributions"], sample)
        self.assertEqual(payload["summary"]["count"], 1)
        self.assertEqual(payload["summary"]["total"], 120.0)

    def test_register_requires_admin_session_and_validates_filters(self):
        denied = finance.financial_register(
            self.request("/api/tlc/financial-register", "TLC/002/2026")
        )
        invalid = finance.financial_register(
            self.request(
                "/api/tlc/financial-register",
                "TLC/001/2026",
                month="2",
            )
        )

        self.assertEqual(denied.status_code, 403)
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(
            json.loads(invalid.content)["message"],
            "A month requires a year.",
        )

    def test_register_returns_ledger_report(self):
        report = {"summary": {"total_funds": 250.0}, "members": []}
        with (
            patch.object(finance, "_configure_data_paths"),
            patch.object(
                finance.ledger_service,
                "build_financial_ledger",
                return_value=report,
            ) as build,
        ):
            response = finance.financial_register(
                self.request(
                    "/api/tlc/financial-register",
                    "TLC/001/2026",
                    year="2026",
                    month="02",
                )
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {"success": True, "report": report},
        )
        build.assert_called_once_with(year="2026", month="02")

    def test_disbursement_endpoint_dispatches_by_method(self):
        with (
            patch.object(finance, "get_disbursements", return_value="get"),
            patch.object(finance, "create_disbursement", return_value="post"),
        ):
            get_response = finance.disbursements(
                self.factory.get("/api/tlc/disbursements")
            )
            post_response = finance.disbursements(
                self.factory.post("/api/tlc/disbursements")
            )

        self.assertEqual(get_response, "get")
        self.assertEqual(post_response, "post")

    def test_financial_summary_requires_member_session(self):
        response = finance.member_financial_summary(
            self.request("/api/member/financial-summary")
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            json.loads(response.content),
            {"success": False, "message": "You must be logged in."},
        )
