const express = require('express');
const router = express.Router();
const { requestMentorship, getMentorshipRequests, updateRequestStatus, processPayment } = require('../controllers/mentorshipController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMentorshipRequests)
    .post(protect, requestMentorship);

router.route('/:id/status').put(protect, updateRequestStatus);
router.route('/:id/pay').put(protect, processPayment);

module.exports = router;
