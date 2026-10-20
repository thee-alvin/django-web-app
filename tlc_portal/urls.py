from django.contrib import admin
from django.urls import include, path

from portal import views


urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.home, name="home"),
    path("", include("portal.api_urls.accounts")),
    path("", include("portal.api_urls.finance")),
    path("", include("portal.api_urls.receipts")),
    path("system-health", views.system_health, name="system-health"),
    path("system-health/", views.system_health),
    path("api/status", views.status, name="status"),
    path("api/status/", views.status),
    path("<path:page_path>", views.page, name="page"),
]
