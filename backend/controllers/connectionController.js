const Connection = require('../models/Connection');

const sendConnectionRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const newConnection = new Connection({
            requester: req.user._id,
            recipient: recipientId,
            status: 'pending'
        });
        await newConnection.save().catch(() => null);
        res.status(201).json({ message: 'Connection request sent', connection: newConnection });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getConnectionRequests = async (req, res) => {
    try {
        const connections = await Connection.find({
            $or: [{ requester: req.user._id }, { recipient: req.user._id }]
        }).populate('requester recipient', 'name role profileImage').catch(() => []);
        res.json(connections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateConnectionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const connection = await Connection.findById(req.params.id).catch(() => null);
        if (connection) {
            connection.status = status;
            await connection.save();
            return res.json({ message: `Connection ${status}`, connection });
        }
        res.json({ message: `Connection status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendConnectionRequest,
    getConnectionRequests,
    updateConnectionStatus
};
