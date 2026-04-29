import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (userData: any) => api.post('/register', userData),
  login: (credentials: any) => api.post('/login', credentials),
  getMe: () => api.get('/users/me'),
  updateMe: (profileData: any) => api.put('/users/me', profileData),
};

export const dietApi = {
  getRecommendation: (params: any = {}) => api.get('/diet/recommendation', { params }),
  saveRecord: (recordData: any) => api.post('/diet/records', recordData),
  getHistory: () => api.get('/diet/history'),
};

export default api;
