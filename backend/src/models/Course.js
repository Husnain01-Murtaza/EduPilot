const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: String,
    semester: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teachingAssistants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creditHours: { type: Number, default: 3, min: 0 },
    // e.g. { quiz: 10, assignment: 20, midterm: 30, final: 40 } (relative weights)
    gradeWeights: { type: mongoose.Schema.Types.Mixed, default: {} },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('Course', courseSchema);
