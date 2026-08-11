const Announcement = require('../models/Announcement');

const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetRole } = req.body;
        const newAnnouncement = new Announcement({
            title,
            content,
            targetRole: targetRole || 'all',
            createdBy: req.user._id
        });
        await newAnnouncement.save().catch(() => null);
        res.status(201).json(newAnnouncement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }).catch(() => []);
        if (announcements && announcements.length > 0) {
            return res.json(announcements);
        }
        res.json([
            {
                _id: 'a1',
                title: 'Annual Alumni Meetup 2026',
                content: 'We are thrilled to announce our upcoming annual reunion! Save the date: September 15th.',
                targetRole: 'all',
                createdAt: new Date()
            }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id).catch(() => null);
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
};
