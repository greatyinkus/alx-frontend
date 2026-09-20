import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('dc_token');
      localStorage.removeItem('dc_user');
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
