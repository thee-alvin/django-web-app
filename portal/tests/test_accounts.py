from django.test import TestCase, override_settings


@override_settings(ROOT_URLCONF="portal.api_urls.accounts", SECURE_SSL_REDIRECT=False)
class AccountApiTests(TestCase):
    def test_login_requires_member_id_and_password(self):
        response = self.client.post("/api/login", data="{}", content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "success": False,
                "message": "Please enter your Member ID and password.",
            },
        )

    def test_member_profile_requires_a_session(self):
        response = self.client.get("/api/member/profile")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["success"], False)

    def test_payment_statement_requires_a_session(self):
        response = self.client.get("/api/member/payment-statement")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["success"], False)

    def test_logout_clears_member_session(self):
        session = self.client.session
        session["member_id"] = "TLC/001/2026"
        session["role"] = "MEMBER"
        session.save()

        response = self.client.post("/api/logout")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("member_id", self.client.session)
