const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['admin', 'student', 'academic', 'industrial', 'company_manager', 'system'],
      default: 'system',
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    portfolio: {
      type: String,
      enum: [
        'auth',
        'students',
        'placements',
        'companies',
        'supervisors',
        'logs',
        'grades',
        'documents',
        'visits',
        'settings',
        'notifications',
        'system',
      ],
      default: 'system',
      index: true,
    },
    targetModel: {
      type: String,
      default: '',
      trim: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    targetLabel: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    requestId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

AuditLogSchema.index({ portfolio: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ targetModel: 1, target: 1, createdAt: -1 });

AuditLogSchema.statics.record = function recordAudit({
  req,
  actor,
  actorRole,
  action,
  portfolio = 'system',
  targetModel = '',
  target = null,
  targetLabel = '',
  metadata = {},
  requestId = '',
} = {}) {
  const requestUser = req?.user;
  return this.create({
    actor: actor || requestUser?._id || null,
    actorRole: actorRole || requestUser?.role || 'system',
    action,
    portfolio,
    targetModel,
    target,
    targetLabel,
    metadata,
    ip: req?.ip || '',
    userAgent: req?.get?.('user-agent') || '',
    requestId: requestId || req?.headers?.['x-request-id'] || '',
  });
};

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
