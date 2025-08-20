from django.urls import path
from .views import (
    RegisterUserAPIView,
    verify_otp,
    LoginAPIView,
    request_password_reset_otp,
    reset_password,
    get_email_from_username,
    GoogleLoginAPIView,
    LogoutAPIView,
)


urlpatterns = [
    path('register/', RegisterUserAPIView.as_view(), name='register'),  # class-based, keep .as_view()
    path('verify-otp/', verify_otp, name='verify-otp'),                 # function-based, no .as_view()
    path('login/', LoginAPIView.as_view(), name='login'),               # class-based
    path('request-reset-otp/', request_password_reset_otp, name='request-reset-otp'),  # function
    path('reset-password/', reset_password, name='reset-password'),                 # function
    path('get-email/', get_email_from_username, name='get-email'),                    # function
    path('google-login/', GoogleLoginAPIView.as_view(), name='google-login'),         # class-based
    path('logout/', LogoutAPIView.as_view(), name='logout'),                          # class-based
]