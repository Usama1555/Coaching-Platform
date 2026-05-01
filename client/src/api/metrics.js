import api from './client';

export async function saveBodyMetric(payload) {
  const response = await api.post('/metrics', payload);
  return response.data;
}

export async function getClientMetrics(clientId) {
  const response = await api.get(`/metrics/client/${clientId}`);
  return response.data;
}

