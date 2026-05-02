import CommentBox from './CommentBox';

export function getDateValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return 'Not logged';
  }

  return new Date(value).toLocaleDateString();
}

function getTotalVolume(session) {
  return session.sets.reduce(
    (sum, set) => sum + (Number(set.repsCompleted) || 0) * (Number(set.weightUsed) || 0),
    0
  );
}

function getCardioLabel(session) {
  if (!session.cardioCompleted && !session.cardioDurationMins) {
    return 'No cardio logged';
  }

  if (session.cardioCompleted && session.cardioDurationMins) {
    return `${session.cardioDurationMins} mins completed`;
  }

  if (session.cardioCompleted) {
    return 'Completed';
  }

  return `${session.cardioDurationMins} mins planned`;
}

function MetricPill({ label, value }) {
  return (
    <div className="h-full min-w-0 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 font-medium leading-tight text-white">{value}</p>
    </div>
  );
}

export default function DailyTrainingReview({
  sessions,
  nutritionLogs,
  metrics,
  selectedDate,
  onDateChange,
  title,
  description,
  commentError = '',
  onSaveComment,
  savingCommentId = '',
}) {
  const matchingSessions = selectedDate
    ? sessions.filter((session) => getDateValue(session.date) === selectedDate)
    : [];
  const matchingNutrition = selectedDate
    ? nutritionLogs.find((log) => getDateValue(log.date) === selectedDate)
    : null;
  const matchingMetric = selectedDate
    ? metrics.find((metric) => getDateValue(metric.date) === selectedDate)
    : null;
  const hasAnyHistory = sessions.length || nutritionLogs.length || metrics.length;

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Day Review</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
          </div>

          <div className="w-full max-w-xs">
            <label htmlFor="daily-review-date" className="mb-2 block text-sm font-medium text-slate-200">
              Select date
            </label>
            <input
              id="daily-review-date"
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="input-shell"
              max={getDateValue(new Date())}
            />
          </div>
        </div>

        {commentError ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {commentError}
          </div>
        ) : null}
      </section>

      {!hasAnyHistory ? (
        <section className="glass-panel p-6 sm:p-8 text-sm leading-6 text-slate-300">
          No workout, nutrition, or check-in history has been logged yet.
        </section>
      ) : !selectedDate ? (
        <section className="glass-panel p-6 sm:p-8 text-sm leading-6 text-slate-300">
          Pick a date to review the exact workout, nutrition, and check-in details from that day.
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="glass-panel p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Workout</p>
                  <h3 className="mt-3 font-display text-2xl font-bold text-white">Training on {selectedDate}</h3>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {matchingSessions.length ? (
                  matchingSessions.map((session) => {
                    const overloadCount = session.sets.filter((set) => set.overloadAlert).length;
                    const totalVolume = getTotalVolume(session);

                    return (
                      <article key={session._id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="font-display text-2xl font-semibold text-white">{session.dayLabel}</p>
                              {session.workoutPlanId?.name ? (
                                <div className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                                  {session.workoutPlanId.name}
                                </div>
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm text-slate-300">Logged on {formatDate(session.date)}</p>
                          </div>

                          <div className="grid w-full gap-3 sm:grid-cols-3 2xl:w-auto 2xl:min-w-[21rem]">
                            <MetricPill label="Sets" value={session.sets.length} />
                            <MetricPill label="Volume" value={totalVolume} />
                            <MetricPill label="Overload" value={overloadCount} />
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                          <MetricPill label="Cardio" value={getCardioLabel(session)} />
                          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Session notes</p>
                            <p className="mt-2 text-white">{session.sessionNotes || 'No notes saved for this workout.'}</p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {session.sets.map((set, index) => (
                            <div
                              key={`${session._id}-${index}`}
                              className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200"
                            >
                              <p className="font-medium text-white">
                                {set.exerciseName} - Set {set.setNumber}
                              </p>
                              <p className="mt-2">
                                {set.repsCompleted} reps at {set.weightUsed} kg
                              </p>
                              <p className="mt-1 text-slate-300">
                                {set.hitFailure ? 'Reached failure' : 'Did not mark failure'}
                              </p>
                              {set.overloadAlert ? (
                                <div className="mt-3">
                                  <span className="inline-flex w-fit items-center rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold">
                                    Overload target hit
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>

                        {onSaveComment ? (
                          <CommentBox
                            sessionId={session._id}
                            existingComment={session.coachComment}
                            onSave={onSaveComment}
                            saving={savingCommentId === session._id}
                          />
                        ) : session.coachComment ? (
                          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                            Coach feedback: {session.coachComment}
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                    No workout was logged on this date.
                  </div>
                )}
              </div>
            </article>

            <article className="glass-panel p-6 sm:p-8">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Nutrition</p>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">Intake on {selectedDate}</h3>
              </div>

              <div className="mt-6 space-y-4">
                {matchingNutrition ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MetricPill label="Calories" value={`${matchingNutrition.totalCalories} kcal`} />
                      <MetricPill label="Protein" value={`${matchingNutrition.totalProtein} g`} />
                      <MetricPill label="Carbs" value={`${matchingNutrition.totalCarbs} g`} />
                      <MetricPill label="Fat" value={`${matchingNutrition.totalFat} g`} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <MetricPill label="Water" value={`${matchingNutrition.waterLitres || 0} L`} />
                      <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Notes</p>
                        <p className="mt-2 text-white">{matchingNutrition.notes || 'No nutrition notes saved.'}</p>
                      </div>
                    </div>

                    {matchingNutrition.meals?.length ? (
                      <div className="space-y-3">
                        {matchingNutrition.meals.map((meal, mealIndex) => (
                          <div key={`${meal.name}-${mealIndex}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="font-medium text-white">{meal.name}</p>
                            <div className="mt-3 space-y-2 text-sm text-slate-200">
                              {meal.foods?.length ? (
                                meal.foods.map((food, foodIndex) => (
                                  <div
                                    key={`${food.name}-${foodIndex}`}
                                    className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2"
                                  >
                                    <p className="font-medium text-white">{food.name}</p>
                                    <p className="mt-1 text-slate-300">
                                      {food.weightGrams || 0}g | {food.calories || 0} kcal | {food.protein || 0}p / {food.carbs || 0}c / {food.fat || 0}f
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-300">No foods saved for this meal.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                        The nutrition log exists for this date, but no individual meal entries were saved.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                    No nutrition log was saved on this date.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Check-In</p>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">Recovery and body metrics on {selectedDate}</h3>
            </div>

            <div className="mt-6">
              {matchingMetric ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricPill label="Weight" value={matchingMetric.weight ? `${matchingMetric.weight} kg` : 'Not logged'} />
                    <MetricPill
                      label="Body Fat"
                      value={matchingMetric.bodyFatPercent !== null && matchingMetric.bodyFatPercent !== undefined ? `${matchingMetric.bodyFatPercent}%` : 'Not logged'}
                    />
                    <MetricPill
                      label="Energy"
                      value={matchingMetric.energyLevel !== null && matchingMetric.energyLevel !== undefined ? `${matchingMetric.energyLevel}/10` : 'Not logged'}
                    />
                    <MetricPill
                      label="Sleep"
                      value={matchingMetric.sleepHours !== null && matchingMetric.sleepHours !== undefined ? `${matchingMetric.sleepHours} hours` : 'Not logged'}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricPill
                      label="Waist"
                      value={matchingMetric.waistCm !== null && matchingMetric.waistCm !== undefined ? `${matchingMetric.waistCm} cm` : 'Not logged'}
                    />
                    <MetricPill
                      label="Chest"
                      value={matchingMetric.chestCm !== null && matchingMetric.chestCm !== undefined ? `${matchingMetric.chestCm} cm` : 'Not logged'}
                    />
                    <MetricPill
                      label="Arms"
                      value={matchingMetric.armCm !== null && matchingMetric.armCm !== undefined ? `${matchingMetric.armCm} cm` : 'Not logged'}
                    />
                    <MetricPill
                      label="Legs"
                      value={matchingMetric.legCm !== null && matchingMetric.legCm !== undefined ? `${matchingMetric.legCm} cm` : 'Not logged'}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Notes</p>
                      <p className="mt-2 text-white">{matchingMetric.notes || 'No check-in notes saved.'}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Coach feedback</p>
                      <p className="mt-2 text-white">{matchingMetric.coachFeedback || 'No coach feedback saved for this check-in yet.'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                  No check-in was saved on this date.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
