export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
  },
  students: `${API_BASE_URL}/api/students`,
  health: `${API_BASE_URL}/api/health`,
};