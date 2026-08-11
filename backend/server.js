const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const eventRoutes = require('./routes/eventRoutes');
const jobRoutes = require('./routes/jobRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Alumni Association API is running smoothly' });
});

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);

// Catch-all 404 for API
app.use((req, res) => {
    res.status(404).json({ message: `API route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Alumni Association Backend running on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`=================================================`);
});
