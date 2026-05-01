import api from './client';

export async function createSessionLog(payload) {
  const response = await api.post('/sessions', payload);
  return response.data;
}

export async function getClientSessions(clientId) {
  const response = await api.get(`/sessions/client/${clientId}`);
  return response.data;
}

export async function getSessionDetail(sessionId) {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
}

export async function addSessionComment(sessionId, payload) {
  const response = await api.put(`/sessions/${sessionId}/comment`, payload);
  return response.data;
}

