import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import './WeeklyLogReport.css';

const STATUS_META = {
  Approved: { label: 'Approved', color: '#15803d', bg: '#f0fdf4', border: '#86efac', Icon: CheckCircle2 },
  Pending: { label: 'Pending', color: '#b45309', bg: '#fffbeb', border: '#fcd34d', Icon: Clock },
  Rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', Icon: XCircle },
};

const toReadableKey = (value = '') =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());

const formatDate = (date, options) =>
  date
    ? new Date(date).toLocaleDateString('en-GB', options)
    : '';

export const buildActivityLabelMap = (settings) => {
  const map = {};
  (settings?.activityCategories || []).forEach(cat => {
    if (cat?.key) map[cat.key] = cat.label || toReadableKey(cat.key);
  });
  return map;
};

export const groupLogsByWeek = (logs = []) => {
  const weeks = {};
  logs.forEach(log => {
    const week = log.week || 1;
    if (!weeks[week]) weeks[week] = { week, days: [] };
    weeks[week].days.push(log);
  });
  Object.values(weeks).forEach(week =>
    week.days.sort((a, b) => new Date(a.date) - new Date(b.date))
  );
  return Object.values(weeks).sort((a, b) => b.week - a.week);
};

export const getLogActivityLabels = (log, activityLabels = {}) => {
  if (Array.isArray(log?.activities) && log.activities.length > 0) {
    return log.activities.map(key => activityLabels[key] || toReadableKey(key));
  }
  if (log?.activity) return [log.activity];
  return ['General attachment activity'];
};

const countByStatus = (logs) => logs.reduce(
  (acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  },
  { Approved: 0, Pending: 0, Rejected: 0 }
);

const summarizeThemes = (logs, activityLabels) => {
  const counts = {};
  logs.forEach(log => {
    getLogActivityLabels(log, activityLabels).forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([label]) => label);
};

const buildReport = (week, logs, activityLabels) => {
  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const statuses = countByStatus(sorted);
  const themes = summarizeThemes(sorted, activityLabels);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const notes = sorted
    .flatMap(log => [log.notes, log.supervisorNote])
    .filter(Boolean)
    .slice(0, 3);

  return {
    week,
    logs: sorted,
    statuses,
    themes,
    notes,
    period: first && last
      ? `${formatDate(first.date, { day: 'numeric', month: 'short' })} - ${formatDate(last.date, { day: 'numeric', month: 'short', year: 'numeric' })}`
      : 'No dates recorded',
  };
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.Pending;
  const Icon = meta.Icon;
  return (
    <span
      className="wlr-status-pill"
      style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
};

const WeeklyLogReport = ({ week, logs = [], activityLabels = {}, compact = false }) => {
  const report = buildReport(week, logs, activityLabels);

  return (
    <section className={`wlr-card ${compact ? 'compact' : ''}`}>
      <div className="wlr-header">
        <div className="wlr-title-block">
          <div className="wlr-icon-box">
            <FileText size={17} />
          </div>
          <div>
            <p className="wlr-eyebrow">Trainee's Weekly Report</p>
            <h4>Week {report.week} Summary</h4>
          </div>
        </div>
        <div className="wlr-period">
          <CalendarDays size={13} />
          {report.period}
        </div>
      </div>

      {report.logs.length === 0 ? (
        <div className="wlr-empty">Not enough entries for a weekly summary yet.</div>
      ) : (
        <>
          <div className="wlr-summary-grid">
            <div className="wlr-summary-main">
              <p>
                This week contains <strong>{report.logs.length}</strong> submitted logbook
                {report.logs.length === 1 ? ' entry' : ' entries'} covering{' '}
                <strong>{report.themes.length ? report.themes.join(', ') : 'general attachment activities'}</strong>.
              </p>
              <p>
                Daily work covered: {report.logs.map(log => {
                  const day = formatDate(log.date, { weekday: 'short' });
                  return `${day}: ${getLogActivityLabels(log, activityLabels).slice(0, 2).join(', ')}`;
                }).join('; ')}.
              </p>
              {report.notes.length > 0 && (
                <div className="wlr-notes">
                  <MessageSquare size={13} />
                  <span>{report.notes.join(' | ')}</span>
                </div>
              )}
            </div>

            <div className="wlr-counts">
              {['Approved', 'Pending', 'Rejected'].map(status => (
                <div key={status} className="wlr-count-item">
                  <StatusPill status={status} />
                  <strong>{report.statuses[status] || 0}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="wlr-flow-section">
            <div className="wlr-flow-title">
              <GitBranch size={15} />
              Weekly Flowchart
            </div>
            <div className="wlr-flow">
              <div className="wlr-flow-node start">
                <span>Week Start</span>
              </div>
              {report.logs.map((log, index) => {
                const labels = getLogActivityLabels(log, activityLabels);
                return (
                  <React.Fragment key={log._id || log.id || `${log.date}-${index}`}>
                    <ArrowRight className="wlr-flow-arrow" size={16} />
                    <div className="wlr-flow-node">
                      <div className="wlr-flow-date">
                        {formatDate(log.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <StatusPill status={log.status} />
                      <div className="wlr-flow-activities">
                        {labels.slice(0, 3).map(label => (
                          <span key={label}>{label}</span>
                        ))}
                        {labels.length > 3 && <span>{labels.length - 3} more</span>}
                      </div>
                      {log.notes && <p>{log.notes}</p>}
                    </div>
                  </React.Fragment>
                );
              })}
              <ArrowRight className="wlr-flow-arrow" size={16} />
              <div className="wlr-flow-node end">
                <span>Weekly Summary</span>
                <small>{report.logs.length} submitted</small>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default WeeklyLogReport;
