const express = require('express');
const router = express.Router();
const { getAlumnis, getAlumniById } = require('../controllers/alumniController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAlumnis);
router.route('/:id').get(protect, getAlumniById);

module.exports = router;
