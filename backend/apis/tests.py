from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from apis.models import User, OTPVerification

class RegistrationTestCase(TestCase):
    def test_student_registration_and_verification(self):
        # 1. Register student -> should send OTP and return OTP in DEBUG mode response
        register_url = reverse('student-register')
        data = {
            'email': 'teststudent@example.com',
            'password': 'Password123'
        }
        response = self.client.post(register_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # In Django tests, settings.DEBUG is forced to False by default, 
        # so we retrieve the OTP from the database instead of the response
        otp_record = OTPVerification.objects.get(email='teststudent@example.com')
        otp = otp_record.otp
        
        # 2. Verify with wrong OTP -> should fail
        verify_url = reverse('verify-otp')
        verify_data = {
            'email': 'teststudent@example.com',
            'otp': '000000'
        }
        response = self.client.post(verify_url, verify_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        
        # 3. Verify with expired OTP -> should fail
        # Retrieve the OTP record and mock its creation time to be 6 minutes ago
        otp_record = OTPVerification.objects.get(email='teststudent@example.com')
        otp_record.created_at = timezone.now() - timedelta(minutes=6)
        otp_record.save()
        
        verify_data['otp'] = otp
        response = self.client.post(verify_url, verify_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', response.data['error'].lower())
        
        # 4. Request new OTP and verify with correct OTP -> should succeed
        response = self.client.post(register_url, data)
        new_otp = OTPVerification.objects.get(email='teststudent@example.com').otp
        verify_data['otp'] = new_otp
        response = self.client.post(verify_url, verify_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('User registered successfully', response.data['message'])
        
        # Verify the user is actually created in the DB
        self.assertTrue(User.objects.filter(email='teststudent@example.com').exists())

    def test_verify_otp_when_user_already_registered(self):
        # 1. Create a user
        User.objects.create_user(email='existinguser@example.com', username='existinguser', password='Password123')
        
        # 2. Try to verify OTP for that user -> should return 400 Bad Request with already_registered=True
        verify_url = reverse('verify-otp')
        verify_data = {
            'email': 'existinguser@example.com',
            'otp': '123456'
        }
        response = self.client.post(verify_url, verify_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(response.data.get('already_registered'))
        self.assertEqual(response.data.get('error'), 'User is already registered. Please log in.')

