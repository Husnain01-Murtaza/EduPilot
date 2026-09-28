const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['instructor', 'ta', 'lab_instructor'], required: true },
    email: String,
    phone: String,
    officeLocation: String,
    officeHours: String,
    bio: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
