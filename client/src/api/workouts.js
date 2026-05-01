import api from './client';

export async function createWorkoutPlan(payload) {
  const response = await api.post('/workouts', payload);
  return response.data;
}

export async function getClientWorkoutPlans(clientId) {
  const response = await api.get(`/workouts/client/${clientId}`);
  return response.data;
}

export async function getActiveWorkoutPlan(clientId) {
  const response = await api.get(`/workouts/active/${clientId}`);
  return response.data;
}
