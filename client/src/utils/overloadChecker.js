export function checkOverload(sets) {
  const alertsByExercise = new Map();

  sets.forEach((set) => {
    const repsCompleted = Number(set.repsCompleted) || 0;
    const weightUsed = Number(set.weightUsed) || 0;

    if (repsCompleted >= 8 && !alertsByExercise.has(set.exerciseName)) {
      alertsByExercise.set(set.exerciseName, {
        exerciseName: set.exerciseName,
        currentWeight: weightUsed,
        suggestedWeight: weightUsed + 2.5,
        message: `You hit ${repsCompleted} reps on ${set.exerciseName} at ${weightUsed}kg. Increase to ${weightUsed + 2.5}kg next session.`,
      });
    }
  });

  return Array.from(alertsByExercise.values());
}

