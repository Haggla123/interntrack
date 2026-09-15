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

const getMilestoneProgress = (student, totalWeeks = 6, signals = {}, now = new Date()) => {
  const safeTotalWeeks = Math.max(1, Number(totalWeeks) || 6);
  const targetLogs = safeTotalWeeks * 7;
  const submittedLogs = Math.max(0, Number(signals.submittedLogs) || 0);
  const approvedLogs = Math.max(0, Number(signals.approvedLogs) || 0);
  const submittedRatio = targetLogs > 0 ? Math.min(submittedLogs / targetLogs, 1) : 0;
  const approvedRatio = targetLogs > 0 ? Math.min(approvedLogs / targetLogs, 1) : 0;

  const score =
    (student?.placementStatus === 'Active' || student?.placementStatus === 'Completed' ? 20 : 0) +
    (student?.industrialSupervisor ? 10 : 0) +
    (submittedRatio * 25) +
    (approvedRatio * 20) +
    (signals.hasIndustrialEvaluation ? 15 : 0) +
    (signals.hasFinalReport ? 10 : 0);

  const calendar = getPlacementProgress(student, safeTotalWeeks, now);
  return {
    ...calendar,
    submittedLogs,
    approvedLogs,
    targetLogs,
    progress: Math.min(100, Math.round(score)),
  };
};

module.exports = {
  getElapsedPlacementDays,
  getPlacementWeekNumber,
  getPlacementProgress,
  getMilestoneProgress,
};
