const express = require('express');
const router = express.Router();
const { sendConnectionRequest, getConnectionRequests, updateConnectionStatus } = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getConnectionRequests)
    .post(protect, sendConnectionRequest);

router.route('/:id/status').put(protect, updateConnectionStatus);

module.exports = router;
