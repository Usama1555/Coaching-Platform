function buildOverloadSummary(sets) {
  const alertsByExercise = new Map();

  const normalizedSets = sets.map((set) => {
    const repsCompleted = Number(set.repsCompleted) || 0;
    const weightUsed = Number(set.weightUsed) || 0;
    const overloadAlert = repsCompleted >= 8;

    if (overloadAlert && !alertsByExercise.has(set.exerciseName)) {
      alertsByExercise.set(set.exerciseName, {
        exerciseName: set.exerciseName,
        currentWeight: weightUsed,
        suggestedWeight: weightUsed + 2.5,
        message: `You hit ${repsCompleted} reps on ${set.exerciseName} at ${weightUsed}kg. Increase to ${weightUsed + 2.5}kg next session.`,
      });
    }

    return {
      ...set,
      repsCompleted,
      weightUsed,
      overloadAlert,
    };
  });

  return {
    sets: normalizedSets,
    alerts: Array.from(alertsByExercise.values()),
  };
}

module.exports = {
  buildOverloadSummary,
};

