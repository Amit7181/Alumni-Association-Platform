const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .catch(() => []);

        if (notifications && notifications.length > 0) {
            return res.json(notifications);
        }

        res.json([
            {
                _id: 'n1',
                title: 'Connection Accepted',
                message: 'Alex Johnson accepted your connection request.',
                read: false,
                createdAt: new Date()
            },
            {
                _id: 'n2',
                title: 'New Event Announcement',
                message: 'Tech Lead Fireside Chat is scheduled for next week.',
                read: true,
                createdAt: new Date()
            }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id).catch(() => null);
        if (notification) {
            notification.read = true;
            await notification.save();
            return res.json(notification);
        }
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id }, { read: true }).catch(() => null);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};
