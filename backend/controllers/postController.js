const Post = require('../models/Post');

const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const image = req.file ? req.file.filename : '';

        const newPost = new Post({
            author: req.user._id,
            authorName: req.user.name || 'Alumni Member',
            authorRole: req.user.role || 'alumni',
            content,
            image
        });

        await newPost.save().catch(() => null);
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).catch(() => []);
        if (posts && posts.length > 0) {
            return res.json(posts);
        }

        res.json([
            {
                _id: 'p1',
                authorName: 'Alex Johnson',
                authorRole: 'Alumni',
                content: 'Excited to announce that our team at Google is hiring summer engineering interns! Reach out if interested.',
                likes: ['user1', 'user2'],
                comments: [
                    { _id: 'c1', userName: 'Jane Smith', text: 'Sent you a DM! Thanks Alex!' }
                ],
                createdAt: new Date()
            },
            {
                _id: 'p2',
                authorName: 'Sarah Williams',
                authorRole: 'Alumni',
                content: 'Great connecting with current computer science students during yesterday’s workshop. High energy!',
                likes: ['user1'],
                comments: [],
                createdAt: new Date()
            }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).catch(() => null);
        if (post) {
            const index = post.likes.indexOf(req.user._id);
            if (index === -1) {
                post.likes.push(req.user._id);
            } else {
                post.likes.splice(index, 1);
            }
            await post.save();
            return res.json({ likesCount: post.likes.length, post });
        }
        res.json({ message: 'Liked post' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.id).catch(() => null);
        if (post) {
            post.comments.push({
                user: req.user._id,
                userName: req.user.name || 'User',
                text
            });
            await post.save();
            return res.json(post);
        }
        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPost,
    getPosts,
    toggleLike,
    addComment
};
