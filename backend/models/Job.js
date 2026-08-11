const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, default: 'Full-time' },
    experience: { type: String },
    salary: { type: String },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postedByName: { type: String },
    applyLink: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
