const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const getBaseUrl = () => {
  return API_URL.replace(/\/api$/, '');
};

export const getWebSocketUrl = (teacherId) => {
  const baseUrl = getBaseUrl();
  const isSecure = baseUrl.startsWith('https');
  const wsScheme = isSecure ? 'wss' : 'ws';
  const host = baseUrl.replace(/^https?:\/\//, '');
  return `${wsScheme}://${host}/ws/comments/teacher/${teacherId}/`;
};

export const getImageUrl = (path, fallback = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800') => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/media/')) {
    cleanPath = `/media${cleanPath}`;
  }
  return `${getBaseUrl()}${cleanPath}`;
};


// Helper for making API requests
const fetchApi = async (endpoint, options = {}) => {
  const headers = { ...options.headers };

  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add token authentication if applicable
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    let errorMessage = error.error || error.message;

    // Handle Django REST framework field validation errors (e.g., {"email": ["Error text"]})
    if (!errorMessage && typeof error === 'object' && error !== null) {
      const fieldErrors = [];
      for (const [key, value] of Object.entries(error)) {
        if (Array.isArray(value)) {
          fieldErrors.push(`${key}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          fieldErrors.push(`${key}: ${value}`);
        }
      }
      if (fieldErrors.length > 0) {
        errorMessage = fieldErrors.join('; ');
      }
    }

    if (!errorMessage) {
      errorMessage = `HTTP error! status: ${response.status}`;
    }

    if (error.details) {
      errorMessage += ' - ' + JSON.stringify(error.details);
    }
    throw new Error(errorMessage);
  }

  // No content response
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Generic CRUD factory for generating API services for a model
const createService = (resourcePath) => ({
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/${resourcePath}/${query ? `?${query}` : ''}`;
    return fetchApi(endpoint);
  },
  getById: (id) => fetchApi(`/${resourcePath}/${id}/`),
  create: (data) => fetchApi(`/${resourcePath}/`, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  update: (id, data) => fetchApi(`/${resourcePath}/${id}/`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  patch: (id, data) => fetchApi(`/${resourcePath}/${id}/`, {
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  delete: (id) => fetchApi(`/${resourcePath}/${id}/`, {
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

// Authentication API
export const authApi = {
  login: (email, password) => fetchApi('/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  registerStudent: (email, password) => fetchApi('/register/student/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  verifyOtp: (email, otp, role) => fetchApi('/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp, role }),
  }),
  forgotPasswordRequest: (email) => fetchApi('/forgot-password/request/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  forgotPasswordVerify: (email, otp, newPassword) => fetchApi('/forgot-password/verify/', {
    method: 'POST',
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  }),
  register: (userData) => fetchApi('/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  getProfile: () => fetchApi('/profile/'),
  updateProfile: (data) => fetchApi('/profile/', {
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  changePassword: (oldPassword, newPassword) => fetchApi('/change-password/', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  }),
};

// Export default API object for convenience
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
};
