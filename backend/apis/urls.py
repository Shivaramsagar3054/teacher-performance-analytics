from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, RegisterView, UserProfileView, TeacherViewSet, EducationViewSet,
    CourseViewSet, CourseTeacherViewSet, CompletedCourseViewSet,
    ResearchInterestViewSet, CommentViewSet, RatingViewSet, EventViewSet, UserViewSet,
    StudentRegistrationView, VerifyOTPView,
    HomepageHeroViewSet, AboutUsHeroViewSet, CampusLifeHeroViewSet,
    EventsHeroViewSet, CampusGalleryViewSet,
    ForgotPasswordRequestView, ForgotPasswordVerifyView,
    ChangePasswordView
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet)
router.register(r'education', EducationViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'course-teachers', CourseTeacherViewSet)
router.register(r'completed-courses', CompletedCourseViewSet)
router.register(r'research-interests', ResearchInterestViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'ratings', RatingViewSet)
router.register(r'events', EventViewSet)
router.register(r'users', UserViewSet)
router.register(r'homepage-hero', HomepageHeroViewSet)
router.register(r'about-us-hero', AboutUsHeroViewSet)
router.register(r'campus-life-hero', CampusLifeHeroViewSet)
router.register(r'events-hero', EventsHeroViewSet)
router.register(r'campus-gallery', CampusGalleryViewSet)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('register/student/', StudentRegistrationView.as_view(), name='student-register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('forgot-password/request/', ForgotPasswordRequestView.as_view(), name='forgot-password-request'),
    path('forgot-password/verify/', ForgotPasswordVerifyView.as_view(), name='forgot-password-verify'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('', include(router.urls)),
]
