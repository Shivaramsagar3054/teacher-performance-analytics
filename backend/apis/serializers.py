from rest_framework import serializers
from .models import (
    User, Teacher, Education, Course, CourseTeacher, CompletedCourse, 
    ResearchInterest, Comment, Rating, Event,
    HomepageHero, AboutUsHero, CampusLifeHero, EventsHero, CampusGallery
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password is not None:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'

class ResearchInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchInterest
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class TeacherBasicSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Teacher
        fields = '__all__'

class CompletedCourseSerializer(serializers.ModelSerializer):
    course_details = serializers.SerializerMethodField()
    teacher_details = serializers.SerializerMethodField()
    class Meta:
        model = CompletedCourse
        fields = '__all__'
    
    def get_course_details(self, obj):
        return CourseSerializer(obj.course).data
    
    def get_teacher_details(self, obj):
        return TeacherBasicSerializer(obj.teacher).data

class TeacherSerializer(TeacherBasicSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    education_list = EducationSerializer(many=True, read_only=True)
    research_interests = ResearchInterestSerializer(many=True, read_only=True)
    completed_courses = CompletedCourseSerializer(many=True, read_only=True)
    avg_pass_percentage = serializers.SerializerMethodField()

    class Meta(TeacherBasicSerializer.Meta):
        fields = '__all__'

    def get_avg_pass_percentage(self, obj):
        completed = obj.completed_courses.all()
        if not completed.exists():
            return 0
        
        total_students = sum(c.total_students for c in completed)
        if total_students == 0:
            return 0
            
        total_passed = sum(c.passed_students for c in completed)
        return round((total_passed / total_students) * 100, 2)

class CourseTeacherSerializer(serializers.ModelSerializer):
    course_details = CourseSerializer(source='course', read_only=True)
    teacher_details = TeacherBasicSerializer(source='teacher', read_only=True)
    class Meta:
        model = CourseTeacher
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'teacher', 'content', 'created_at', 'status', 'is_anonymous', 'user_name', 'user_email', 'parent']

    def get_user_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous"
        return obj.user.username if obj.user else "Unknown User"

    def get_user_email(self, obj):
        if obj.is_anonymous:
            return None
        return obj.user.email if obj.user else "Unknown Email"

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    organizer_details = TeacherBasicSerializer(source='organizer', read_only=True)
    class Meta:
        model = Event
        fields = '__all__'

class HomepageHeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomepageHero
        fields = '__all__'

class AboutUsHeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutUsHero
        fields = '__all__'

class CampusLifeHeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusLifeHero
        fields = '__all__'

class EventsHeroSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventsHero
        fields = '__all__'

class CampusGallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusGallery
        fields = '__all__'

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class StudentRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(required=False, default='student')
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    role = serializers.CharField(required=False, default='student')

class ForgotPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user is registered with this email address.")
        return value

class ForgotPasswordVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
