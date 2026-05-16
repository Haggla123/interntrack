const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtcDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const getPlacementStartDate = (student) => (
  student?.placementStartDate ||
  student?.placement?.reviewedAt ||
  student?.updatedAt ||
  student?.createdAt ||
  null
);

const getElapsedPlacementDays = (student, now = new Date()) => {
  if (!student || student.placementStatus !== 'Active') return 0;
  const start = toUtcDateOnly(getPlacementStartDate(student));
  const today = toUtcDateOnly(now);
  if (start === null || today === null || today < start) return 0;
  return Math.floor((today - start) / MS_PER_DAY);
};

const getPlacementWeekNumber = (student, now = new Date()) =>
  Math.floor(getElapsedPlacementDays(student, now) / 7) + 1;

const getPlacementProgress = (student, totalWeeks = 6, now = new Date()) => {
  const safeTotalWeeks = Math.max(1, Number(totalWeeks) || 6);
  const elapsedDays = getElapsedPlacementDays(student, now);
  const elapsedWeeks = Math.min(Math.floor(elapsedDays / 7), safeTotalWeeks);
  const progress = Math.min(100, Math.round((elapsedWeeks / safeTotalWeeks) * 100));

  return {
    elapsedDays,
    weeks: elapsedWeeks,
    currentWeek: student?.placementStatus === 'Active'
      ? Math.min(getPlacementWeekNumber(student, now), safeTotalWeeks)
      : 0,
    progress,
  };
};

module.exports = {
  getElapsedPlacementDays,
  getPlacementWeekNumber,
  getPlacementProgress,
};
