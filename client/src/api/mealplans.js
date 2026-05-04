import api from './client';

export async function createMealPlan(payload) {
  const response = await api.post('/mealplans', payload);
  return response.data;
}

export async function getClientMealPlans(clientId) {
  const response = await api.get(`/mealplans/client/${clientId}`);
  return response.data;
}

export async function getActiveMealPlan(clientId) {
  const response = await api.get(`/mealplans/active/${clientId}`);
  return response.data;
}

export async function updateMealPlan(planId, payload) {
  const response = await api.put(`/mealplans/${planId}`, payload);
  return response.data;
}

export async function deleteMealPlan(planId) {
  const response = await api.delete(`/mealplans/${planId}`);
  return response.data;
}
