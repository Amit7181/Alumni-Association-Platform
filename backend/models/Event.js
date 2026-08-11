const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String },
    location: { type: String, required: true },
    type: { type: String, enum: ['Webinar', 'Meetup', 'Workshop', 'Reunion'], default: 'Webinar' },
    bannerImage: { type: String },
    meetingUrl: { type: String },
    speakers: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
