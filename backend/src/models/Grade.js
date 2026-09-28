const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
    component: {
      type: String,
      enum: ['quiz', 'assignment', 'midterm', 'final', 'project'],
      required: true,
    },
    label: { type: String, default: '', trim: true }, // e.g. "Quiz 2"
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, default: 100, min: 1 },
    feedback: String,
  },
  { timestamps: true }
);

gradeSchema.index(
  { student: 1, course: 1, component: 1, label: 1, assignment: 1 },
  { unique: true }
);

module.exports = mongoose.model('Grade', gradeSchema);
