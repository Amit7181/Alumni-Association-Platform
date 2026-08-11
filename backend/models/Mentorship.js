const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    message: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    amount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
