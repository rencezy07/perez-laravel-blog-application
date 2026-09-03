import axios from 'axios';

/**
 * API Client for communicating with Laravel backend
 * Automatically handles authentication tokens and CORS
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

console.log('🌐 API URL configured as:', API_URL);

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for Sanctum auth cookies
  timeout: 10000, // 10 second timeout
});

/**
 * Request Interceptor
 * Adds authentication token to every request if available
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token attached to request');
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request config error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors and manages authentication state
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ API Error ${error.response.status}:`, error.response.data);
      
      // Handle 401 Unauthorized - clear auth and redirect to login
      if (error.response.status === 401) {
        console.log('🔓 Unauthorized - clearing auth tokens');
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.warn('🚫 Access forbidden - insufficient permissions');
      }
      
      // Handle 404 Not Found
      if (error.response.status === 404) {
        console.warn('🔍 Resource not found');
      }
      
      // Handle 500 Server Error
      if (error.response.status === 500) {
        console.error('💥 Server error - check backend logs');
      }
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Auth API endpoints
 */
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

/**
 * Posts API endpoints
 */
export const postsAPI = {
  getAll: (params) => apiClient.get('/posts', { params }),
  getById: (id) => apiClient.get(`/posts/${id}`),
  create: (data) => apiClient.post('/posts', data),
  update: (id, data) => apiClient.put(`/posts/${id}`, data),
  delete: (id) => apiClient.delete(`/posts/${id}`),
};

/**
 * Categories API endpoints
 */
export const categoriesAPI = {
  getAll: (params) => apiClient.get('/categories', { params }),
  getById: (id) => apiClient.get(`/categories/${id}`),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`),
};

/**
 * Comments API endpoints
 */
export const commentsAPI = {
  getAll: (params) => apiClient.get('/comments', { params }),
  getById: (id) => apiClient.get(`/comments/${id}`),
  create: (data) => apiClient.post('/comments', data),
  update: (id, data) => apiClient.put(`/comments/${id}`, data),
  delete: (id) => apiClient.delete(`/comments/${id}`),
};

/**
 * Users API endpoints
 */
export const usersAPI = {
  getAll: (params) => apiClient.get('/users', { params }),
  getById: (id) => apiClient.get(`/users/${id}`),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
};

/**
 * Profile API endpoints
 */
export const profileAPI = {
  get: () => apiClient.get('/profile'),
  update: (data) => apiClient.put('/profile', data),
  changePassword: (data) => apiClient.post('/profile/change-password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

/**
 * Utility function to check API connectivity
 */
export const checkAPIHealth = async () => {
  try {
    // Try to call a public endpoint (if available)
    await apiClient.get('/health');
    console.log('✅ API is healthy');
    return true;
  } catch (error) {
    console.warn('⚠️ API health check failed:', error.message);
    return false;
  }
};

/**
 * Utility function to set auth token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Auth token saved');
  } else {
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
    console.log('🔓 Auth token cleared');
  }
};

/**
 * Utility function to check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
};

export default apiClient;
