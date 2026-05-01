import api from './client';

export async function saveNutritionLog(payload) {
  const response = await api.post('/nutrition', payload);
  return response.data;
}

export async function getClientNutritionHistory(clientId) {
  const response = await api.get(`/nutrition/client/${clientId}`);
  return response.data;
}

export async function getTodayNutrition(clientId) {
  const response = await api.get(`/nutrition/today/${clientId}`);
  return response.data;
}

