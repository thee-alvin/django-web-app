from django.test import SimpleTestCase


class PortalPageTests(SimpleTestCase):
    def test_home_renders_the_existing_portal_theme(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "THE LEGACY CIRCLE")
        self.assertContains(response, "/css/main.css")

    def test_existing_page_routes_render_django_templates(self):
        for path in ("/login", "/dashboard", "/member/profile"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)

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
