const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'alumni', 'admin'], default: 'student' },
    phone: { type: String },
    batch: { type: String },
    department: { type: String },
    company: { type: String },
    designation: { type: String },
    location: { type: String },
    bio: { type: String },
    skills: [{ type: String }],
    profileImage: { type: String, default: 'default-profile.png' },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
