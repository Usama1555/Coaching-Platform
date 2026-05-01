export function getDashboardRoute(userOrRole) {
  if (typeof userOrRole === 'string') {
    return userOrRole === 'coach' ? '/coach' : '/client';
  }

  const user = userOrRole || {};

  if (user.isOwner) {
    return '/owner';
  }

  if (user.role === 'coach') {
    return user.coachApprovalStatus === 'approved' ? '/coach' : '/coach/pending';
  }

  return '/client';
}
