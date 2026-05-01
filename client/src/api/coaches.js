import api from './client';

export async function getCoachDashboard() {
  const response = await api.get('/coaches/dashboard');
  return response.data;
}

export async function getCoachClients() {
  const response = await api.get('/coaches/clients');
  return response.data;
}

export async function getCoachClientDetail(clientId) {
  const response = await api.get(`/coaches/clients/${clientId}`);
  return response.data;
}

export async function inviteCoachClient(payload) {
  const response = await api.post('/coaches/clients/invite', payload);
  return response.data;
}

export async function updateCoachClientPassword(clientId, payload) {
  const response = await api.put(`/coaches/clients/${clientId}/password`, payload);
  return response.data;
}

export async function deleteCoachClient(clientId) {
  const response = await api.delete(`/coaches/clients/${clientId}`);
  return response.data;
}
