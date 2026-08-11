const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, registerEvent, startMeeting } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getEvents)
    .post(protect, allowRoles('admin'), upload.single('bannerImage'), createEvent);

router.route('/:id').get(protect, getEventById);
router.route('/:id/register').post(protect, registerEvent);
router.route('/:id/start').post(protect, startMeeting);

module.exports = router;
