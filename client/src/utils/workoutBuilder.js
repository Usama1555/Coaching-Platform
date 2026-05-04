export function createExercise() {
  return {
    name: '',
    muscleGroup: '',
    targetSets: 2,
    targetRepsMin: 5,
    targetRepsMax: 8,
    targetWeight: 0,
    notes: '',
  };
}

export function createDay(dayNumber, label = `Day ${dayNumber}`, isRest = true) {
  return {
    dayNumber,
    label,
    isRest,
    exercises: [],
    cardio: {
      type: '',
      durationMins: 0,
      speed: 0,
      incline: 0,
    },
  };
}

export function buildWorkoutStructure(splitType) {
  const templates = {
    ULRULRR: [
      createDay(1, 'Upper A', false),
      createDay(2, 'Lower A', false),
      createDay(3, 'Recovery', true),
      createDay(4, 'Upper B', false),
      createDay(5, 'Lower B', false),
      createDay(6, 'Recovery', true),
      createDay(7, 'Recovery', true),
    ],
    PPlRUL: [
      createDay(1, 'Push', false),
      createDay(2, 'Pull', false),
      createDay(3, 'Legs', false),
      createDay(4, 'Recovery', true),
      createDay(5, 'Upper', false),
      createDay(6, 'Lower', false),
      createDay(7, 'Recovery', true),
    ],
  };

  return templates[splitType] || Array.from({ length: 7 }, (_, index) => createDay(index + 1));
}

export function cloneWorkoutDays(days = []) {
  if (!days.length) {
    return buildWorkoutStructure('custom');
  }

  return days.map((day) => ({
    dayNumber: day.dayNumber,
    label: day.label || `Day ${day.dayNumber}`,
    isRest: Boolean(day.isRest),
    exercises: (day.exercises || []).map((exercise) => ({
      name: exercise.name || '',
      muscleGroup: exercise.muscleGroup || '',
      targetSets: exercise.targetSets ?? 2,
      targetRepsMin: exercise.targetRepsMin ?? 5,
      targetRepsMax: exercise.targetRepsMax ?? 8,
      targetWeight: exercise.targetWeight ?? 0,
      notes: exercise.notes || '',
    })),
    cardio: {
      type: day.cardio?.type || '',
      durationMins: day.cardio?.durationMins ?? 0,
      speed: day.cardio?.speed ?? 0,
      incline: day.cardio?.incline ?? 0,
    },
  }));
}

export function formatDateForInput(value) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
}

export function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
