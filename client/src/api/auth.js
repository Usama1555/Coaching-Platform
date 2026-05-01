import api from './client';

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function updateCurrentUser(payload) {
  const response = await api.put('/auth/me', payload);
  return response.data;
}

export async function changePassword(payload) {
  const response = await api.put('/auth/password', payload);
  return response.data;
}
