import api from './client';

export async function sendAIMessage(payload) {
  const response = await api.post('/ai/chat', payload);
  return response.data;
}

export async function getAIHistory(clientId) {
  const response = await api.get(`/ai/history/${clientId}`);
  return response.data;
}
