// Controllers/gradeController.js
const Grade = require('../models/Grade');
const User  = require('../models/User');
const Settings = require('../models/Settings');
const { canAccessStudent, requireStudentAccess } = require('../utils/accessControl');

const LEGACY_CRITERIA = [
  { key: 'attendance', label: 'Attendance', max: 15 },
  { key: 'punctuality', label: 'Punctuality', max: 15 },
  { key: 'cooperation', label: 'Co-operation', max: 10 },
  { key: 'aptitudeForLearning', label: 'Aptitude for Learning', max: 15 },
  { key: 'understandingOfJob', label: 'Understanding of Job', max: 15 },
  { key: 'safetyAdherence', label: 'Adherence to Safety & Environment Rules', max: 15 },
  { key: 'workIndependently', label: 'Ability to Work Independently', max: 15 },
];

const scoreToGrade = (pct) => {
  if (pct >= 80) return 'A';
  if (pct >= 75) return 'B+';
  if (pct >= 70) return 'B';
  if (pct >= 65) return 'C+';
  if (pct >= 60) return 'C';
  if (pct >= 55) return 'D+';
  if (pct >= 45) return 'D';
  return 'F';
};

const scoreLegacyFields = (body) => Object.fromEntries(
  LEGACY_CRITERIA.map(c => [c.key, body[c.key] ?? null])
);

const buildLegacyCriteriaScores = (body) => {
  const scores = [];
  for (const criterion of LEGACY_CRITERIA) {
    if (body[criterion.key] !== undefined && body[criterion.key] !== null) {
      scores.push({
        ...criterion,
        score: Number(body[criterion.key]),
      });
    }
  }
  return scores;
};

const normalizeCriteriaScores = (submitted, rubric) => {
  if (!Array.isArray(submitted) || submitted.length === 0) {
    throw new Error('criteriaScores is required for industrial evaluations.');
  }
  if (!Array.isArray(rubric) || rubric.length === 0) {
    throw new Error('Industrial evaluation criteria are not configured.');
  }

  const byKey = new Map(submitted.map(item => [String(item?.key || ''), item]));
  const normalized = rubric.map(criterion => {
    const item = byKey.get(criterion.key);
    if (!item) {
      throw new Error(`Missing score for "${criterion.label}".`);
    }

    const score = Number(item.score);
    const max = Number(criterion.max);
    if (!Number.isFinite(score) || score < 0 || score > max) {
      throw new Error(`Score for "${criterion.label}" must be between 0 and ${max}.`);
    }

    return {
      key: criterion.key,
      label: criterion.label,
      max,
      score,
    };
  });

  const totalMax = normalized.reduce((sum, item) => sum + item.max, 0);
  const totalScore = normalized.reduce((sum, item) => sum + item.score, 0);
  const percent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return { criteriaScores: normalized, score: percent, grade: scoreToGrade(percent) };
};

// ── POST /api/grades ─────────────────────────────────────────────
const submitGrade = async (req, res) => {
  try {
    const {
      studentId, grade, score, comments, type,
      criteriaScores,
      // All 7 UENR criteria stored as raw marks
      attendance, punctuality, cooperation,
      aptitudeForLearning, understandingOfJob,
      safetyAdherence, workIndependently,
    } = req.body;

    if (!studentId) return res.status(400).json({ message: 'studentId is required.' });
    if (!grade)     return res.status(400).json({ message: 'grade is required.' });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    if (!canAccessStudent(req.user, student)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const gradeType = type || (req.user.role === 'industrial' ? 'industrial' : 'academic');

    // ── Ownership checks ─────────────────────────────────────────
    if (req.user.role === 'industrial') {
      // Industrial supervisor may only grade students explicitly assigned to them.
      const directLink  = student.industrialSupervisor &&
        student.industrialSupervisor.toString() === req.user._id.toString();
      if (!directLink) {
        return res.status(403).json({ message: 'You can only evaluate students assigned to you.' });
      }
    } else if (req.user.role === 'academic') {
      // Academic supervisor may only grade students assigned to them
      const assigned = student.academicSupervisor &&
        student.academicSupervisor.toString() === req.user._id.toString();
      if (!assigned) {
        return res.status(403).json({ message: 'You can only grade students assigned to you.' });
      }
    }

    const legacyScores = scoreLegacyFields({
      attendance, punctuality, cooperation,
      aptitudeForLearning, understandingOfJob,
      safetyAdherence, workIndependently,
    });
    let industrialEvaluation = null;
    if (gradeType === 'industrial') {
      const settings = await Settings.getOrCreate();
      const submittedCriteria = Array.isArray(criteriaScores) && criteriaScores.length
        ? criteriaScores
        : buildLegacyCriteriaScores({
            attendance, punctuality, cooperation,
            aptitudeForLearning, understandingOfJob,
            safetyAdherence, workIndependently,
          });
      industrialEvaluation = normalizeCriteriaScores(
        submittedCriteria,
        settings.industrialEvaluationCriteria
      );
    }

    const record = await Grade.findOneAndUpdate(
      { student: studentId, type: gradeType },
      {
        student:      studentId,
        submittedBy:  req.user._id,
        type:         gradeType,
        grade:        industrialEvaluation?.grade ?? grade,
        score:        industrialEvaluation?.score ?? score ?? null,
        comments:           comments          || '',
        criteriaScores:     industrialEvaluation?.criteriaScores ?? [],
        attendance:         legacyScores.attendance,
        punctuality:        legacyScores.punctuality,
        cooperation:        legacyScores.cooperation,
        aptitudeForLearning: legacyScores.aptitudeForLearning,
        understandingOfJob:  legacyScores.understandingOfJob,
        safetyAdherence:    legacyScores.safetyAdherence,
        workIndependently:  legacyScores.workIndependently,
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Only mark the student as fully "Graded" when an academic or
    // report grade is submitted. Industrial scores are intermediate inputs
    // that academic supervisors use to arrive at the final grade.
    if (gradeType === 'academic' || gradeType === 'report') {
      await User.findByIdAndUpdate(studentId, {
        gradeStatus: 'Graded',
        finalGrade:  grade,
      });
    }

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    const status = /criteria|score|Missing/i.test(err.message) ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

// ── PUT /api/grades/:id ──────────────────────────────────────────
const updateGrade = async (req, res) => {
  try {
    const {
      grade, score, comments, criteriaScores,
      attendance, punctuality, cooperation,
      aptitudeForLearning, understandingOfJob,
      safetyAdherence, workIndependently,
    } = req.body;

    const record = await Grade.findById(req.params.id)
      .populate('student', '_id role academicSupervisor industrialSupervisor companyId');
    if (!record) return res.status(404).json({ message: 'Grade record not found.' });
    if (!canAccessStudent(req.user, record.student)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (record.type === 'industrial' && criteriaScores !== undefined) {
      const rubric = record.criteriaScores?.length
        ? record.criteriaScores
        : (await Settings.getOrCreate()).industrialEvaluationCriteria;
      const industrialEvaluation = normalizeCriteriaScores(criteriaScores, rubric);
      record.criteriaScores = industrialEvaluation.criteriaScores;
      record.score = industrialEvaluation.score;
      record.grade = industrialEvaluation.grade;
    } else {
      if (grade               !== undefined) record.grade = grade;
      if (score               !== undefined) record.score = score;
    }
    if (comments            !== undefined) record.comments = comments;
    if (attendance          !== undefined) record.attendance = attendance;
    if (punctuality         !== undefined) record.punctuality = punctuality;
    if (cooperation         !== undefined) record.cooperation = cooperation;
    if (aptitudeForLearning !== undefined) record.aptitudeForLearning = aptitudeForLearning;
    if (understandingOfJob  !== undefined) record.understandingOfJob = understandingOfJob;
    if (safetyAdherence     !== undefined) record.safetyAdherence = safetyAdherence;
    if (workIndependently   !== undefined) record.workIndependently = workIndependently;
    record.submittedBy = req.user._id;
    await record.save();

    // Same rule — only sync finalGrade for academic/report types
    if (grade && (record.type === 'academic' || record.type === 'report')) {
      await User.findByIdAndUpdate(record.student?._id || record.student, {
        finalGrade:  grade,
        gradeStatus: 'Graded',
      });
    }

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    const status = /criteria|score|Missing/i.test(err.message) ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

// ── GET /api/grades/mine — supervisor's own submissions ──────────
// Returns all grades submitted by the current user.
// Industrial supervisors call this on mount so they can immediately see
// which students are already evaluated without N individual lookups.
const getMyGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ submittedBy: req.user._id })
      .populate('student', 'name indexNumber department')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: grades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/grades/student/:studentId ───────────────────────────
const getStudentGrade = async (req, res) => {
  try {
    const student = await requireStudentAccess(req, res, req.params.studentId);
    if (!student) return;

    const grades = await Grade.find({ student: req.params.studentId })
      .populate('submittedBy', 'name role')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: grades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/grades ───────────────────────────────────────────────
const getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate('student',     'name indexNumber department')
      .populate('submittedBy', 'name role')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: grades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitGrade, updateGrade, getMyGrades, getStudentGrade, getAllGrades };
