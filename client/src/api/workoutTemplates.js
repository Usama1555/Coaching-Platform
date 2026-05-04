import api from './client';

export async function getWorkoutTemplates() {
  const response = await api.get('/workout-templates');
  return response.data;
}

export async function getWorkoutTemplate(templateId) {
  const response = await api.get(`/workout-templates/${templateId}`);
  return response.data;
}

export async function createWorkoutTemplate(payload) {
  const response = await api.post('/workout-templates', payload);
  return response.data;
}

export async function updateWorkoutTemplate(templateId, payload) {
  const response = await api.put(`/workout-templates/${templateId}`, payload);
  return response.data;
}

export async function deleteWorkoutTemplate(templateId) {
  const response = await api.delete(`/workout-templates/${templateId}`);
  return response.data;
}
