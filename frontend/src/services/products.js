import api from './api';

export const getProducts = async (page = 1, limit = 10, category = '', search = '') => {
  const params = new URLSearchParams({ page, limit });
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  
  const response = await api.get(`/products?${params}`);
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
