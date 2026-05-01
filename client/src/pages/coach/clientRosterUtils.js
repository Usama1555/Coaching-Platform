export const rosterFilters = [
  { id: 'all', label: 'All' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'no_plan', label: 'No plan' },
  { id: 'workout', label: 'Workout stale' },
  { id: 'nutrition', label: 'Nutrition stale' },
  { id: 'checkin', label: 'Check-in overdue' },
];

export const sortOptions = [
  { id: 'attention', label: 'Needs attention first' },
  { id: 'last_active', label: 'Last active' },
  { id: 'newest', label: 'Newest clients' },
  { id: 'name', label: 'Alphabetical' },
];

export function formatDate(value) {
  if (!value) {
    return 'Not logged';
  }

  return new Date(value).toLocaleDateString();
}

export function formatTextLabel(value) {
  if (!value) {
    return 'Not set';
  }

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getDateTimestamp(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getDaysSince(value) {
  const timestamp = getDateTimestamp(value);

  if (!timestamp) {
    return null;
  }

  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}

function getStatusPriority(status) {
  if (status === 'inactive') {
    return 0;
  }

  if (status === 'needs_attention') {
    return 1;
  }

  return 2;
}

export function formatStatusLabel(value) {
  return value === 'on_track'
    ? 'On Track'
    : value === 'inactive'
      ? 'Inactive'
      : 'Needs Attention';
}

export function getStatusClasses(status) {
  if (status === 'on_track') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  }

  if (status === 'inactive') {
    return 'border-slate-400/20 bg-slate-500/10 text-slate-200';
  }

  return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
}

export function getRowClasses(status) {
  if (status === 'on_track') {
    return 'border-emerald-400/20 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.08]';
  }

  if (status === 'inactive') {
    return 'border-slate-400/20 bg-white/[0.03] hover:bg-white/[0.06]';
  }

  return 'border-amber-400/20 bg-amber-500/[0.05] hover:bg-amber-500/[0.09]';
}

export function getClientName(client) {
  return client.user?.name || 'Unnamed client';
}

export function getRosterFlags(client) {
  const workoutDays = getDaysSince(client.latestSessionAt);
  const nutritionDays = getDaysSince(client.latestNutritionAt);
  const checkInDays = getDaysSince(client.latestMetricAt);

  return {
    needsAttention: client.status === 'needs_attention' || client.status === 'inactive',
    inactive: client.status === 'inactive',
    noPlan: !client.activePlan,
    staleWorkout: workoutDays === null || workoutDays > 7,
    staleNutrition: nutritionDays === null || nutritionDays > 3,
    overdueCheckIn: checkInDays === null || checkInDays > 14,
  };
}

export function matchesSearch(client, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    getClientName(client),
    client.user?.email,
    client.goal,
    client.experience,
    client.status,
    client.statusReason,
    client.activePlan?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function matchesFilter(client, filterId) {
  if (filterId === 'all') {
    return true;
  }

  const flags = getRosterFlags(client);

  if (filterId === 'attention') {
    return flags.needsAttention;
  }

  if (filterId === 'inactive') {
    return flags.inactive;
  }

  if (filterId === 'no_plan') {
    return flags.noPlan;
  }

  if (filterId === 'workout') {
    return flags.staleWorkout;
  }

  if (filterId === 'nutrition') {
    return flags.staleNutrition;
  }

  if (filterId === 'checkin') {
    return flags.overdueCheckIn;
  }

  return true;
}

export function sortClients(clients, sortBy) {
  const nextClients = [...clients];

  nextClients.sort((left, right) => {
    if (sortBy === 'name') {
      return getClientName(left).localeCompare(getClientName(right));
    }

    if (sortBy === 'newest') {
      return getDateTimestamp(right.joinedAt) - getDateTimestamp(left.joinedAt);
    }

    if (sortBy === 'last_active') {
      return getDateTimestamp(right.lastActiveAt) - getDateTimestamp(left.lastActiveAt);
    }

    const statusDifference = getStatusPriority(left.status) - getStatusPriority(right.status);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const activeDifference = getDateTimestamp(left.lastActiveAt) - getDateTimestamp(right.lastActiveAt);

    if (activeDifference !== 0) {
      return activeDifference;
    }

    return getDateTimestamp(right.joinedAt) - getDateTimestamp(left.joinedAt);
  });

  return nextClients;
}
