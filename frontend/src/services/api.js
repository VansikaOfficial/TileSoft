import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({ baseURL: BASE_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const api = {
  auth: {
    login: (data) => axiosInstance.post('/auth/login', data),
    register: (data) => axiosInstance.post('/auth/register', data),
    me: () => axiosInstance.get('/auth/me'),
  },
  dashboard: {
    stats: () => axiosInstance.get('/dashboard/quick-stats'),
    analytics: () => axiosInstance.get('/dashboard/analytics'),
  },
  products: {
    getAll: (params) => axiosInstance.get('/products', { params }),
    getOne: (id) => axiosInstance.get(`/products/${id}`),
    create: (data) => axiosInstance.post('/products', data),
    update: (id, data) => axiosInstance.put(`/products/${id}`, data),
    delete: (id) => axiosInstance.delete(`/products/${id}`),
  },
  customers: {
    getAll: (params) => axiosInstance.get('/customers', { params }),
    getOne: (id) => axiosInstance.get(`/customers/${id}`),
    create: (data) => axiosInstance.post('/customers', data),
    update: (id, data) => axiosInstance.put(`/customers/${id}`, data),
    delete: (id) => axiosInstance.delete(`/customers/${id}`),
  },
  invoices: {
    getAll: (params) => axiosInstance.get('/invoices', { params }),
    getOne: (id) => axiosInstance.get(`/invoices/${id}`),
    create: (data) => axiosInstance.post('/invoices', data),
    update: (id, data) => axiosInstance.put(`/invoices/${id}`, data),
  },
  employees: {
    getAll: (params) => axiosInstance.get('/employees', { params }),
    getOne: (id) => axiosInstance.get(`/employees/${id}`),
    create: (data) => axiosInstance.post('/employees', data),
    update: (id, data) => axiosInstance.put(`/employees/${id}`, data),
    delete: (id) => axiosInstance.delete(`/employees/${id}`),
  },
  attendance: {
    getAll: (params) => axiosInstance.get('/attendance', { params }),
    getSummary: () => axiosInstance.get('/attendance/summary'),
    mark: (data) => axiosInstance.post('/attendance', data),
  },
  suppliers: {
    getAll: (params) => axiosInstance.get('/suppliers', { params }),
    create: (data) => axiosInstance.post('/suppliers', data),
    update: (id, data) => axiosInstance.put(`/suppliers/${id}`, data),
  },
};

export default api;
