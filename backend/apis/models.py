from django.db import models
from django.contrib.auth.models import AbstractUser

class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class BaseHeroSection(TimestampedModel):
    title = models.CharField(max_length=200)
    subtitle = models.TextField()
    description = models.TextField(blank=True, null=True)
    button_text = models.CharField(max_length=50, blank=True, null=True)
    button_link = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class HomepageHero(BaseHeroSection):
    hero_image = models.ImageField(upload_to='homepage/')
    
    class Meta(BaseHeroSection.Meta):
        verbose_name = "Homepage Hero Section"
        verbose_name_plural = "Homepage Hero Sections"

class AboutUsHero(BaseHeroSection):
    hero_image = models.ImageField(upload_to='aboutus/')
    
    class Meta(BaseHeroSection.Meta):
        verbose_name = "About Us Hero Section"
        verbose_name_plural = "About Us Hero Sections"

class CampusLifeHero(BaseHeroSection):
    hero_image = models.ImageField(upload_to='campuslife/')
    
    class Meta(BaseHeroSection.Meta):
        verbose_name = "Campus Life Hero Section"
        verbose_name_plural = "Campus Life Hero Sections"

class EventsHero(BaseHeroSection):
    hero_image = models.ImageField(upload_to='events_hero/')
    
    class Meta(BaseHeroSection.Meta):
        verbose_name = "Events Hero Section"
        verbose_name_plural = "Events Hero Sections"

class CampusGallery(models.Model):
    CATEGORY_CHOICES = (
        ('sports', 'Sports'),
        ('labs', 'Labs'),
        ('classrooms', 'Classrooms'),
        ('cultural', 'Cultural'),
        ('infrastructure', 'Infrastructure'),
        ('events', 'Events'),
        ('others', 'Others'),
    )
    image_title = models.CharField(max_length=200)
    image = models.ImageField(upload_to='campus_gallery/')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='others')
    description = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Campus Gallery Image"
        verbose_name_plural = "Campus Gallery Images"
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.image_title} ({self.get_category_display()})"


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='apis_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='apis_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    years_of_experience = models.IntegerField(default=0)
    phone_number = models.CharField(max_length=20)
    biography = models.TextField()
    location = models.CharField(max_length=100)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Education(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='education_list')
    degree = models.CharField(max_length=100)
    field_of_study = models.CharField(max_length=100)
    institution_name = models.CharField(max_length=150)
    university_name = models.CharField(max_length=150)
    start_year = models.CharField(max_length=4)
    end_year = models.CharField(max_length=4)
    gradeOrCgpa = models.DecimalField(max_digits=4, decimal_places=2)

class Course(models.Model):
    course_name = models.CharField(max_length=200)
    course_code = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    slot = models.CharField(max_length=3)
    description = models.TextField()

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

class CourseTeacher(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    is_current = models.BooleanField(default=True)

class CompletedCourse(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='completed_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    course_full_name = models.CharField(max_length=200)
    exam_type = models.CharField(max_length=50)
    completion_date = models.DateField()
    slot = models.CharField(max_length=20)
    s_grades = models.IntegerField(default=0)
    a_grades = models.IntegerField(default=0)
    b_grades = models.IntegerField(default=0)
    c_grades = models.IntegerField(default=0)
    d_grades = models.IntegerField(default=0)
    e_grades = models.IntegerField(default=0)
    fail_grades = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)
    passed_students = models.IntegerField(default=0)
    pass_percentage = models.DecimalField(max_digits=5, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.passed_students = (
            self.s_grades + self.a_grades + self.b_grades + 
            self.c_grades + self.d_grades + self.e_grades
        )
        self.total_students = self.passed_students + self.fail_grades
        
        if self.total_students > 0:
            self.pass_percentage = (self.passed_students / self.total_students) * 100
        else:
            self.pass_percentage = 0
            
        super().save(*args, **kwargs)

class ResearchInterest(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='research_interests')
    topic = models.CharField(max_length=200)

class Comment(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='approved')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')

class Rating(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    teaching_skill = models.IntegerField()
    subject_knowledge = models.IntegerField()
    communication = models.IntegerField()
    approachability = models.IntegerField()
    overall_score = models.DecimalField(max_digits=3, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=50)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=200)
    organizer = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    image_path = models.ImageField(upload_to='event_images/', blank=True, null=True)
    registration_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class OTPVerification(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    password = models.CharField(max_length=128)  # To store hashed password temporarily
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OTP for {self.email}"
