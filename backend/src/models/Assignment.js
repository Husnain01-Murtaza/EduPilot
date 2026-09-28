const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    type: { type: String, enum: ['assignment', 'quiz', 'project', 'exam'], required: true },
    dueDate: { type: Date, required: true },
    weight: { type: Number, default: 0, min: 0, max: 100 },
    totalMarks: { type: Number, default: 100, min: 0 },
    attachments: [{ url: String, fileName: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
