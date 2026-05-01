import api from './client';

export async function getOwnerCoaches() {
  const response = await api.get('/owner/coaches');
  return response.data;
}

export async function updateOwnerCoachApproval(coachId, payload) {
  const response = await api.put(`/owner/coaches/${coachId}/approval`, payload);
  return response.data;
}
