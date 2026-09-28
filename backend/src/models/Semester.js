const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
    archivedData: {
      courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
      grades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grade' }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Semester', semesterSchema);
