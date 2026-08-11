const express = require('express');
const router = express.Router();
const { createPost, getPosts, toggleLike, addComment } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getPosts)
    .post(protect, upload.single('image'), createPost);

router.route('/:id/like').post(protect, toggleLike);
router.route('/:id/comment').post(protect, addComment);

module.exports = router;
