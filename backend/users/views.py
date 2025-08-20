from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model, authenticate
from .models import EmailOTP
from .serializers import UserSerializer
from django.core.mail import send_mail
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.permissions import IsAuthenticated
from django_ratelimit.decorators import ratelimit


User = get_user_model()


class RegisterUserAPIView(APIView):
    @ratelimit(key='ip', rate='5/m', method='POST', block=True)
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')

        if User.objects.filter(username=username).exists():
            return Response({'username': ['Username already taken.']}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'email': ['Email already registered. Please login instead.']}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(is_active=False)
            EmailOTP.objects.filter(user=user).delete()
            email_otp = EmailOTP.objects.create(user=user)
            subject = 'Your OTP Verification Code'
            message = f'Dear {user.username},\n\nYour OTP code is {email_otp.otp_code}. It expires in 10 minutes.\n\nThank you!'
            send_mail(subject, message, None, [user.email])
            return Response({'detail': 'User registered. Please check your email for OTP.'}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(APIView):
    @ratelimit(key='ip', rate='10/m', method='POST', block=True)
    def post(self, request):
        identifier = request.data.get('identifier')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({'detail': 'Please provide both identifier and password.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if '@' in identifier:
                user_obj = User.objects.get(email=identifier)
                username = user_obj.username
            else:
                username = identifier
        except User.DoesNotExist:
            return Response({'detail': 'Invalid username/email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid username/email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'User not active. Please verify your email.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'username': user.username,
                'email': user.email
            }
        })


@ratelimit(key='ip', rate='5/m', method='POST', block=True)
@api_view(['POST'])
def request_password_reset_otp(request):
    identifier = request.data.get('identifier')
    if not identifier:
        return Response({'detail': 'Username or email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if '@' in identifier:
            user = User.objects.get(email=identifier)
        else:
            user = User.objects.get(username=identifier)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    EmailOTP.objects.filter(user=user).delete()
    otp = EmailOTP.objects.create(user=user)

    subject = 'Password Reset OTP'
    message = f'Dear {user.username},\n\nYour OTP code for password reset is {otp.otp_code}. It expires in 10 minutes.\n\nThank you!'
    send_mail(subject, message, None, [user.email])

    return Response({'detail': 'OTP sent to registered email.'})


@api_view(['POST'])
def reset_password(request):
    identifier = request.data.get('identifier')
    otp_code = request.data.get('otp_code')
    new_password = request.data.get('new_password')

    if not identifier or not otp_code or not new_password:
        return Response({'detail': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if '@' in identifier:
            user = User.objects.get(email=identifier)
        else:
            user = User.objects.get(username=identifier)
        otp = user.email_otp
    except (User.DoesNotExist, EmailOTP.DoesNotExist):
        return Response({'detail': 'Invalid username/email or OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    if otp.is_expired():
        return Response({'detail': 'OTP expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    if otp.otp_code != otp_code:
        return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    otp.delete()

    return Response({'detail': 'Password reset successful. You may now login.'})


@api_view(['POST'])
def verify_otp(request):
    username = request.data.get('username')
    otp_code = request.data.get('otp_code')

    try:
        user = User.objects.get(username=username)
        email_otp = user.email_otp
    except (User.DoesNotExist, EmailOTP.DoesNotExist):
        return Response({'detail': 'Invalid username or OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    if email_otp.is_expired():
        return Response({'detail': 'OTP expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    if email_otp.otp_code != otp_code:
        return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    user.is_active = True
    user.save()
    email_otp.delete()
    return Response({'detail': 'Email verified. You can now log in.'})


@api_view(['POST'])
def get_email_from_username(request):
    username = request.data.get('username')
    if not username:
        return Response({'detail': 'Username required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(username=username)
        return Response({'email': user.email})
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class GoogleLoginAPIView(APIView):
    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'detail': 'ID token required'}, status=400)
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), "YOUR_GOOGLE_CLIENT_ID")
            email = idinfo.get('email')
            username = idinfo.get('sub')  # Google user id or create username based on email
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': email.split('@')[0], 'is_active': True}
            )
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {'username': user.username, 'email': user.email}
            })
        except ValueError:
            return Response({'detail': 'Invalid Google token'}, status=400)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)
