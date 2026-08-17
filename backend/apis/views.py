from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password
import random
from .serializers import (
    UserSerializer, LoginSerializer, TeacherSerializer, 
    EducationSerializer, CourseSerializer, CourseTeacherSerializer,
    CompletedCourseSerializer, ResearchInterestSerializer,
    CommentSerializer, RatingSerializer, EventSerializer,
    StudentRegistrationSerializer, OTPVerificationSerializer,
    HomepageHeroSerializer, AboutUsHeroSerializer, CampusLifeHeroSerializer,
    EventsHeroSerializer, CampusGallerySerializer,
    ForgotPasswordRequestSerializer, ForgotPasswordVerifySerializer,
    ChangePasswordSerializer
)
from .models import (
    User, Teacher, Education, Course, CourseTeacher, 
    CompletedCourse, ResearchInterest, Comment, Rating, Event,
    OTPVerification,
    HomepageHero, AboutUsHero, CampusLifeHero, EventsHero, CampusGallery
)

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsAdminTeacherOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return bool(request.user and request.user.is_authenticated and (request.user.role in ['teacher', 'admin']))

class IsTeacherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['teacher', 'admin'] or request.user.is_staff)
        )

class StudentRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = StudentRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                password = serializer.validated_data['password']
                
                if User.objects.filter(email=email).exists():
                    return Response({
                        'error': 'User already exists with this email address.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                otp = str(random.randint(100000, 999999))
                hashed_password = make_password(password)
                
                print(f"[REGISTRATION] Generating OTP {otp} for email {email}")
                OTPVerification.objects.update_or_create(
                    email=email,
                    defaults={'otp': otp, 'password': hashed_password}
                )
                
                subject = 'Verify Your Email - Teacher Performance Portal'
                plain_message = f'Your OTP for registration is: {otp}'
                html_message = f"""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>OTP Verification</title>
                </head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; color: #333333;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); font-size: 16px; line-height: 1.6;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 40px; text-align: center; color: #ffffff;">
                              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Teacher Performance Portal</h1>
                              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Secure Student Account Verification</p>
                            </td>
                          </tr>
                          
                          <!-- Body Content -->
                          <tr>
                            <td style="padding: 40px;">
                              <h2 style="margin-top: 0; color: #1e3c72; font-size: 20px;">Email Verification Code</h2>
                              <p style="color: #555555; margin-bottom: 25px;">
                                Welcome to the <strong>Teacher Performance Portal</strong>. Please use the One-Time Password (OTP) below to verify your email address and complete your registration.
                              </p>
                              
                              <!-- OTP Box -->
                              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
                                <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1e3c72; font-family: monospace;">{otp}</span>
                              </div>
                              
                              <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                                ⏰ <strong>Security Note:</strong> This OTP is valid for 10 minutes. If you did not request this verification code, please ignore this email.
                              </p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                              <p style="margin: 0;">&copy; Teacher Performance Portal. All rights reserved.</p>
                              <p style="margin: 5px 0 0 0;">This is an automated security email. Please do not reply directly to this message.</p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                
                try:
                    from django.core.mail import get_connection, EmailMultiAlternatives
                    connection = get_connection(
                        backend=settings.EMAIL_BACKEND,
                        fail_silently=False,
                        timeout=getattr(settings, 'EMAIL_TIMEOUT', 5)
                    )
                    mail_msg = EmailMultiAlternatives(
                        subject,
                        plain_message,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        connection=connection
                    )
                    mail_msg.attach_alternative(html_message, "text/html")
                    mail_msg.send()
                except Exception as mail_err:
                    return Response({
                        'error': 'Failed to send verification email. Please check SMTP configuration on the server.',
                        'details': str(mail_err)
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response({
                    'message': 'OTP sent to your email. Please verify to complete registration.'
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Internal Error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = OTPVerificationSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                otp = serializer.validated_data['otp']
                
                print(f"[VERIFICATION] Request received for email: {email}, OTP: {otp}")
                
                # Check if user already exists (e.g. from a previous successful request)
                if User.objects.filter(email=email).exists():
                    print(f"[VERIFICATION] User {email} is already registered.")
                    return Response({
                        'error': 'User is already registered. Please log in.',
                        'already_registered': True
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    otp_record = OTPVerification.objects.get(email=email, otp=otp)
                    print(f"[VERIFICATION] Found record in DB: email={otp_record.email}, otp={otp_record.otp}, created={otp_record.created_at}")
                    
                    # Check for 5 minutes expiration
                    from django.utils import timezone
                    from datetime import timedelta
                    if timezone.now() > otp_record.created_at + timedelta(minutes=5):
                        print(f"[VERIFICATION] OTP has expired (created at {otp_record.created_at}, now is {timezone.now()})")
                        otp_record.delete()
                        return Response({'error': 'OTP has expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    base_username = email.split('@')[0]
                    username = base_username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1

                    user = User.objects.create(
                        email=email,
                        username=username,
                        password=otp_record.password,
                        role=serializer.validated_data.get('role', 'student')
                    )
                    otp_record.delete()
                    
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': 'User registered successfully.',
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user': UserSerializer(user).data
                    }, status=status.HTTP_201_CREATED)
                except OTPVerification.DoesNotExist:
                    print(f"[VERIFICATION] No matching record found in DB for email {email} and OTP {otp}")
                    existing = OTPVerification.objects.filter(email=email)
                    if existing.exists():
                        for rec in existing:
                            print(f"  -> Existing record in DB: email={rec.email}, otp={rec.otp}, created={rec.created_at}")
                    else:
                        print(f"  -> No records found in DB for email {email} at all.")
                    return Response({'error': 'Invalid OTP or email'}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Internal Error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                password = serializer.validated_data['password']
                user = authenticate(username=email, password=password)

                if user:
                    refresh = RefreshToken.for_user(user)
                    teacher_data = None
                    if user.role == 'teacher':
                        try:
                            teacher = user.teacher_profile
                            teacher_data = TeacherSerializer(teacher).data
                        except Teacher.DoesNotExist:
                            teacher_data = None

                    return Response({
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user': UserSerializer(user).data,
                        'teacher_profile': teacher_data
                    }, status=status.HTTP_200_OK)
                return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Internal Error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user)
        data = serializer.data
        if user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                data['teacher_profile'] = TeacherSerializer(teacher).data
            except Exception:
                data['teacher_profile'] = None
        return Response(data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAdminTeacherOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        search = self.request.query_params.get('search')
        user_id = self.request.query_params.get('user_id') or self.request.query_params.get('user')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        if department and department != 'All Professors':
            queryset = queryset.filter(department=department)
        
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) |
                Q(department__icontains=search) |
                Q(biography__icontains=search)
            )
        return queryset.order_by('id')

class EducationViewSet(viewsets.ModelViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer
    permission_classes = [IsTeacherOrAdmin]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminTeacherOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        search = self.request.query_params.get('search')
        
        if department and department != 'All Courses' and department != 'All Departments':
            queryset = queryset.filter(department__iexact=department)
            
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(course_name__icontains=search) | 
                Q(course_code__icontains=search) |
                Q(description__icontains=search)
            )
        return queryset.order_by('id')

class CourseTeacherViewSet(viewsets.ModelViewSet):
    queryset = CourseTeacher.objects.all().select_related('course', 'teacher', 'teacher__user')
    serializer_class = CourseTeacherSerializer
    permission_classes = [IsAdminTeacherOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher_id')
        course_id = self.request.query_params.get('course')
        is_current = self.request.query_params.get('is_current')
        
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if is_current:
            queryset = queryset.filter(is_current=is_current.lower() == 'true')
        return queryset

class CompletedCourseViewSet(viewsets.ModelViewSet):
    queryset = CompletedCourse.objects.all().select_related('course', 'teacher', 'teacher__user')
    serializer_class = CompletedCourseSerializer
    permission_classes = [IsAdminTeacherOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher_id')
        course_id = self.request.query_params.get('course')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

class ResearchInterestViewSet(viewsets.ModelViewSet):
    queryset = ResearchInterest.objects.all()
    serializer_class = ResearchInterestSerializer
    permission_classes = [IsTeacherOrAdmin]

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().select_related('organizer', 'organizer__user').order_by('-start_date')
    serializer_class = EventSerializer
    permission_classes = [IsAdminTeacherOrReadOnly]

    def create(self, request, *args, **kwargs):
        print("====== INCOMING EVENT POST DATA ======")
        print(request.data)
        print("=======================================")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("====== EVENT VALIDATION ERRORS ======")
            print(serializer.errors)
            print("=====================================")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        organizer = serializer.validated_data.get('organizer')
        if not organizer and hasattr(self.request.user, 'teacher_profile'):
            serializer.save(organizer=self.request.user.teacher_profile)
        elif not organizer:
            teacher = Teacher.objects.filter(user=self.request.user).first()
            if teacher:
                serializer.save(organizer=teacher)
            else:
                serializer.save()
        else:
            serializer.save()

    def get_queryset(self):
        # Automatically delete events whose end_date was more than 3 days ago
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=3)
        Event.objects.filter(end_date__lt=cutoff).delete()

        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        organizer_id = self.request.query_params.get('organizer_id')
        
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(event_type__icontains=search) |
                Q(location__icontains=search)
            )
            
        if organizer_id:
            queryset = queryset.filter(organizer_id=organizer_id)
            
        return queryset

class HomepageHeroViewSet(viewsets.ModelViewSet):
    queryset = HomepageHero.objects.all()
    serializer_class = HomepageHeroSerializer
    permission_classes = [IsAdminOrReadOnly]

class AboutUsHeroViewSet(viewsets.ModelViewSet):
    queryset = AboutUsHero.objects.all()
    serializer_class = AboutUsHeroSerializer
    permission_classes = [IsAdminOrReadOnly]

class CampusLifeHeroViewSet(viewsets.ModelViewSet):
    queryset = CampusLifeHero.objects.all()
    serializer_class = CampusLifeHeroSerializer
    permission_classes = [IsAdminOrReadOnly]

class EventsHeroViewSet(viewsets.ModelViewSet):
    queryset = EventsHero.objects.all()
    serializer_class = EventsHeroSerializer
    permission_classes = [IsAdminOrReadOnly]

class CampusGalleryViewSet(viewsets.ModelViewSet):
    queryset = CampusGallery.objects.all()
    serializer_class = CampusGallerySerializer
    permission_classes = [IsAdminOrReadOnly]

class ForgotPasswordRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = ForgotPasswordRequestSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                
                # Generate a 6-digit OTP
                otp = str(random.randint(100000, 999999))
                
                # Save the OTP in the OTPVerification table with a dummy password
                # 'RESET_PASSWORD' will indicate that this OTP is for password resetting,
                # rather than student registration.
                OTPVerification.objects.update_or_create(
                    email=email,
                    defaults={'otp': otp, 'password': 'RESET_PASSWORD'}
                )
                
                # Send email
                subject = 'Reset Your Password - Teacher Performance Portal'
                plain_message = f'Your OTP code to reset your password is: {otp}'
                html_message = f"""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Password Reset OTP</title>
                </head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; color: #333333;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); font-size: 16px; line-height: 1.6;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #0a1930 0%, #1e3c72 100%); padding: 30px 40px; text-align: center; color: #ffffff;">
                              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Teacher Performance Portal</h1>
                              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Secure Password Reset Request</p>
                            </td>
                          </tr>
                          
                          <!-- Body Content -->
                          <tr>
                            <td style="padding: 40px;">
                              <h2 style="margin-top: 0; color: #0a1930; font-size: 20px;">Password Reset Code</h2>
                              <p style="color: #555555; margin-bottom: 25px;">
                                We received a request to reset your password. Use the One-Time Password (OTP) code below to verify your identity.
                              </p>
                              
                              <!-- OTP Box -->
                              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
                                <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0a1930; font-family: monospace;">{otp}</span>
                              </div>
                              
                              <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                                ⏰ <strong>Security Note:</strong> This OTP is valid for 5 minutes. If you did not request this password reset, please ignore this email.
                              </p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                              <p style="margin: 0;">&copy; Teacher Performance Portal. All rights reserved.</p>
                              <p style="margin: 5px 0 0 0;">This is an automated security email. Please do not reply directly to this message.</p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                
                try:
                    from django.core.mail import get_connection, EmailMultiAlternatives
                    connection = get_connection(
                        backend=settings.EMAIL_BACKEND,
                        fail_silently=False,
                        timeout=getattr(settings, 'EMAIL_TIMEOUT', 5)
                    )
                    mail_msg = EmailMultiAlternatives(
                        subject,
                        plain_message,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        connection=connection
                    )
                    mail_msg.attach_alternative(html_message, "text/html")
                    mail_msg.send()
                except Exception as mail_err:
                    return Response({
                        'error': 'Failed to send reset email. Please check SMTP configuration on the server.',
                        'details': str(mail_err)
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response({
                    'message': 'OTP sent to your email. Please verify to reset password.'
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Internal Error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ForgotPasswordVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = ForgotPasswordVerifySerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data['email']
                otp = serializer.validated_data['otp']
                new_password = serializer.validated_data['new_password']
                
                try:
                    otp_record = OTPVerification.objects.get(email=email, otp=otp, password='RESET_PASSWORD')
                    
                    # Check for 5 minutes expiration
                    from django.utils import timezone
                    from datetime import timedelta
                    if timezone.now() > otp_record.created_at + timedelta(minutes=5):
                        otp_record.delete()
                        return Response({'error': 'OTP has expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Update user password
                    user = User.objects.get(email=email)
                    user.set_password(new_password)
                    user.save()
                    
                    # Clean up the OTP record
                    otp_record.delete()
                    
                    return Response({
                        'message': 'Password has been reset successfully.'
                    }, status=status.HTTP_200_OK)
                except OTPVerification.DoesNotExist:
                    return Response({
                        'error': 'Invalid OTP or email address.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                except User.DoesNotExist:
                    return Response({
                        'error': 'User not found.'
                    }, status=status.HTTP_404_NOT_FOUND)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Internal Error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = ChangePasswordSerializer(data=request.data)
            if serializer.is_valid():
                user = request.user
                old_password = serializer.validated_data['old_password']
                new_password = serializer.validated_data['new_password']

                if not user.check_password(old_password):
                    return Response({'error': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)

                user.set_password(new_password)
                user.save()
                return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Internal Error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
