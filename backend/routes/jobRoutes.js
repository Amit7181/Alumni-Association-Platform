const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.route('/')
    .get(protect, getJobs)
    .post(protect, allowRoles('alumni', 'admin'), createJob);

router.route('/:id').get(protect, getJobById);

module.exports = router;
