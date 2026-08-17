import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';


// Helper for making API requests
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = { ...((options.headers as Record<string, string>) || {}) };

  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add token authentication if applicable (skip for public auth endpoints)
  const isPublicEndpoint = 
    endpoint.startsWith('/login') || 
    endpoint.startsWith('/register') || 
    endpoint.startsWith('/verify-otp') ||
    endpoint.startsWith('/forgot-password');

  if (!isPublicEndpoint) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to fetch token from storage', e);
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));

      // Extract the most meaningful message from any backend shape
      let errorMessage =
        body.error ||
        body.message ||
        body.detail ||
        (Array.isArray(body.non_field_errors) ? body.non_field_errors[0] : null) ||
        null;

      // If still no message, pick the first field-level error value
      if (!errorMessage && typeof body === 'object') {
        const firstKey = Object.keys(body)[0];
        if (firstKey) {
          const val = body[firstKey];
          errorMessage = Array.isArray(val) ? val[0] : String(val);
        }
      }

      // Friendly HTTP-status fallbacks when backend gives nothing useful
      if (!errorMessage) {
        const statusMessages: Record<number, string> = {
          400: 'Bad request. Please check the information you entered.',
          401: 'Unauthorized. Please login again.',
          403: 'You do not have permission to perform this action.',
          404: 'The requested resource was not found.',
          409: 'A conflict occurred. This record may already exist.',
          422: 'The data you submitted is invalid. Please check and try again.',
          429: 'Too many requests. Please wait a moment and try again.',
          500: 'Server error. Please try again later.',
          502: 'Service temporarily unavailable. Please try again later.',
          503: 'Service unavailable. Please try again later.',
        };
        errorMessage = statusMessages[response.status] || `Request failed (status ${response.status}).`;
      }

      // Attach status and raw body to the error for granular handling in screens
      const err: any = new Error(errorMessage);
      err.status = response.status;
      err.body = body;
      throw err;
    }

    // No content response
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (err) {
    console.warn(`API Error on ${endpoint}:`, err);
    throw err;
  }
};

// Generic CRUD factory for generating API services for a model
const createService = (resourcePath: string) => ({
  getAll: (params: Record<string, any> = {}) => {
    // Filter out undefined/empty params
    const cleanParams = Object.keys(params).reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== '') {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, any>);
    
    const query = new URLSearchParams(cleanParams).toString();
    const endpoint = `/${resourcePath}/${query ? `?${query}` : ''}`;
    return fetchApi(endpoint);
  },
  getById: (id: string | number) => fetchApi(`/${resourcePath}/${id}/`),
  create: (data: any) => fetchApi(`/${resourcePath}/`, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  update: (id: string | number, data: any) => fetchApi(`/${resourcePath}/${id}/`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  patch: (id: string | number, data: any) => fetchApi(`/${resourcePath}/${id}/`, {
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  delete: (id: string | number) => fetchApi(`/${resourcePath}/${id}/`, {
    method: 'DELETE',
  }),
});

// Export services for all views (models)
export const usersApi = createService('users');
export const teachersApi = createService('teachers');
export const educationApi = createService('education');
export const coursesApi = createService('courses');
export const courseTeachersApi = createService('course-teachers');
export const completedCoursesApi = createService('completed-courses');
export const researchInterestsApi = createService('research-interests');
export const commentsApi = createService('comments');
export const ratingsApi = createService('ratings');
export const eventsApi = createService('events');
export const campusLifeHeroApi = createService('campus-life-hero');
export const campusGalleryApi = createService('campus-gallery');
export const aboutUsHeroApi = createService('about-us-hero');

// Authentication API
export const authApi = {
  login: (email: string, password: string) => fetchApi('/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  registerStudent: (email: string, password: string) => fetchApi('/register/student/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  verifyOtp: (email: string, otp: string) => fetchApi('/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  }),
  forgotPasswordRequest: (email: string) => fetchApi('/forgot-password/request/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  forgotPasswordVerify: (email: string, otp: string, newPassword: string) => fetchApi('/forgot-password/verify/', {
    method: 'POST',
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  }),
  register: (userData: any) => fetchApi('/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  getProfile: () => fetchApi('/profile/'),
  updateProfile: (data: any) => fetchApi('/profile/', {
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  changePassword: (oldPassword: string, newPassword: string) => fetchApi('/change-password/', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  }),
};

// Image URL helper since images from backend are absolute path but missing host
export const getImageUrl = (path: string | undefined | null) => {
  if (!path) return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800';
  if (path.startsWith('http')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

export default {
  auth: authApi,
  users: usersApi,
  teachers: teachersApi,
  education: educationApi,
  courses: coursesApi,
  courseTeachers: courseTeachersApi,
  completedCourses: completedCoursesApi,
  researchInterests: researchInterestsApi,
  comments: commentsApi,
  ratings: ratingsApi,
  events: eventsApi,
  campusLifeHero: campusLifeHeroApi,
  campusGallery: campusGalleryApi,
  aboutUsHero: aboutUsHeroApi,
  getImageUrl,
};
