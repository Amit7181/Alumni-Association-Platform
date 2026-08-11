const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.route('/')
    .get(protect, getAnnouncements)
    .post(protect, allowRoles('admin'), createAnnouncement);

router.route('/:id')
    .delete(protect, allowRoles('admin'), deleteAnnouncement);

module.exports = router;
