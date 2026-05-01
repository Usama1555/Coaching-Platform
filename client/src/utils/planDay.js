export function getPlanDayForDate(plan, currentDate = new Date()) {
  if (!plan?.days?.length) {
    return null;
  }

  const startDate = new Date(plan.weekStartDate);
  const today = new Date(currentDate);

  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((today - startDate) / 86400000);
  const dayIndex = diffInDays < 0 ? 0 : diffInDays % 7;
  const expectedDayNumber = dayIndex + 1;

  return (
    plan.days.find((day) => Number(day.dayNumber) === expectedDayNumber) ||
    plan.days[dayIndex] ||
    plan.days[0]
  );
}

