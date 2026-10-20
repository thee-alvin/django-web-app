from django.urls import path

from portal.api_views import accounts


urlpatterns = [
    path("api/forgot-password", accounts.forgot_password, name="forgot-password-api"),
    path("api/verify-member", accounts.verify_member, name="verify-member"),
    path("api/activate-account", accounts.activate_account, name="activate-account"),
    path("api/login", accounts.member_login, name="member-login"),
    path("api/reset-password", accounts.reset_password, name="reset-password-api"),
    path("api/logout", accounts.member_logout, name="member-logout"),
    path("api/member-profile", accounts.member_profile, name="member-profile"),
    path("api/member/profile", accounts.get_profile, name="member-profile-detail"),
    path("api/member/profile/update", accounts.update_profile, name="member-profile-update"),
    path("api/member/payment-statement", accounts.member_payment_statement, name="member-payment-statement"),
]
