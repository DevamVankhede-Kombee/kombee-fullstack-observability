import api from './api';

export const getOrders = async (page = 1, limit = 10, status = '') => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  
  const response = await api.get(`/orders?${params}`);
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (data) => {
  const response = await api.post('/orders', data);
  return response.data;
};

export const updateOrder = async (id, data) => {
  const response = await api.put(`/orders/${id}`, data);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.put(`/orders/${id}/status`, { status });
  return response.data;
};
