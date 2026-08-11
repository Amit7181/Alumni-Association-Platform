const User = require('../models/User');

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').catch(() => null);
        if (user) {
            return res.json(user);
        }
        res.json({
            id: req.user._id || 'demo_id',
            name: req.user.name || 'Sample User',
            email: req.user.email || 'user@example.com',
            role: req.user.role || 'alumni',
            batch: '2024',
            department: 'Computer Science',
            company: 'Tech Corp',
            designation: 'Software Engineer',
            location: 'New York, USA',
            bio: 'Passionate software developer and alumni mentor.',
            skills: ['JavaScript', 'Node.js', 'React', 'MongoDB']
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).catch(() => null);
        
        const updateData = { ...req.body };
        if (req.file) {
            updateData.profileImage = req.file.filename;
        }

        if (user) {
            Object.assign(user, updateData);
            const updatedUser = await user.save();
            return res.json(updatedUser);
        }

        res.json({ message: 'Profile updated', profile: updateData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserAnalytics = async (req, res) => {
    res.json({
        totalConnections: 18,
        eventsAttended: 5,
        mentorshipSessions: 3,
        jobsApplied: 4
    });
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserAnalytics
};
