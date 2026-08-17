from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Teacher, Education, Course, CourseTeacher, CompletedCourse, 
    ResearchInterest, Comment, Rating, Event,
    HomepageHero, AboutUsHero, CampusLifeHero, EventsHero, CampusGallery,
    OTPVerification
)

@admin.register(HomepageHero)
class HomepageHeroAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)

@admin.register(AboutUsHero)
class AboutUsHeroAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)

@admin.register(CampusLifeHero)
class CampusLifeHeroAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)

@admin.register(EventsHero)
class EventsHeroAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)

@admin.register(CampusGallery)
class CampusGalleryAdmin(admin.ModelAdmin):
    list_display = ('image_title', 'category', 'is_featured', 'uploaded_at')
    list_filter = ('category', 'is_featured')
    search_fields = ('image_title', 'description')

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role',)}),
    )

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'department', 'position', 'years_of_experience')
    search_fields = ('first_name', 'last_name', 'department', 'position')
    list_filter = ('department', 'position')

@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'degree', 'institution_name', 'university_name', 'end_year')
    search_fields = ('teacher__first_name', 'teacher__last_name', 'degree', 'institution_name')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('course_code', 'course_name', 'department', 'slot')
    search_fields = ('course_code', 'course_name', 'department')
    list_filter = ('department', 'slot')

@admin.register(CourseTeacher)
class CourseTeacherAdmin(admin.ModelAdmin):
    list_display = ('course', 'teacher', 'is_current')
    list_filter = ('is_current',)
    search_fields = ('course__course_name', 'teacher__first_name', 'teacher__last_name')

@admin.register(CompletedCourse)
class CompletedCourseAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'course', 'completion_date', 'total_students', 'pass_percentage')
    readonly_fields = ('pass_percentage',)
    search_fields = ('teacher__first_name', 'teacher__last_name', 'course__course_name')
    list_filter = ('completion_date',)

@admin.register(ResearchInterest)
class ResearchInterestAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'topic')
    search_fields = ('teacher__first_name', 'teacher__last_name', 'topic')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'user', 'course', 'status', 'created_at', 'is_anonymous')
    list_filter = ('status', 'is_anonymous', 'created_at')
    search_fields = ('teacher__first_name', 'teacher__last_name', 'user__email', 'content')

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'user', 'overall_score', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('teacher__first_name', 'teacher__last_name', 'user__email')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'start_date', 'end_date', 'location')
    list_filter = ('event_type', 'start_date')
    search_fields = ('title', 'description', 'location')

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'otp', 'created_at')
    search_fields = ('email', 'otp')
    readonly_fields = ('created_at',)
