const express = require('express');
const router = express.Router();
const { getAnalytics, getAllUsers, toggleBlockUser, deleteUser, deleteJob, deleteEvent } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.use(protect, allowRoles('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleBlockUser);
router.delete('/users/:id', deleteUser);
router.delete('/jobs/:id', deleteJob);
router.delete('/events/:id', deleteEvent);

module.exports = router;
