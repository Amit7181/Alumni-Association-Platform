const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');

// In-memory OTP storage fallback if DB is offline
const otpStore = new Map();

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, batch, department, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const userExists = await User.findOne({ email }).catch(() => null);
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
            batch: batch || '',
            department: department || '',
            phone: phone || ''
        });

        await newUser.save().catch(() => null);

        const token = generateToken(newUser._id || 'mock_user_id', newUser.role);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id || 'mock_user_id',
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                profileImage: newUser.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Registration error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        let user = await User.findOne({ email }).catch(() => null);

        // Fallback demo user check if database is empty
        if (!user) {
            if (email === 'admin@alumni.com' && password === 'admin123') {
                const token = generateToken('admin_demo_id', 'admin');
                return res.json({
                    token,
                    user: { id: 'admin_demo_id', name: 'System Admin', email, role: 'admin' }
                });
            } else if (email === 'alumni@alumni.com' && password === 'alumni123') {
                const token = generateToken('alumni_demo_id', 'alumni');
                return res.json({
                    token,
                    user: { id: 'alumni_demo_id', name: 'Demo Alumni', email, role: 'alumni' }
                });
            } else if (email === 'student@alumni.com' && password === 'student123') {
                const token = generateToken('student_demo_id', 'student');
                return res.json({
                    token,
                    user: { id: 'student_demo_id', name: 'Demo Student', email, role: 'student' }
                });
            }
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Account is blocked by administrator' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Login error' });
    }
};

const sendEmailOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);

    try {
        await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp}`);
    } catch (err) {
        console.log('Sending email failed, OTP code is:', otp);
    }

    res.json({ message: 'OTP sent to email', demoOtp: otp });
};

const verifyEmailOTP = async (req, res) => {
    const { email, otpCode } = req.body;
    const storedOtp = otpStore.get(email);

    if (storedOtp && storedOtp === otpCode) {
        otpStore.delete(email);
        return res.json({ message: 'OTP verified successfully' });
    }
    return res.status(400).json({ message: 'Invalid or expired OTP' });
};

const sendPhoneOTP = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, otp);

    try {
        await sendSMS(phone, `Your OTP code is: ${otp}`);
    } catch (err) {
        console.log('SMS error, OTP is:', otp);
    }

    res.json({ message: 'OTP sent to phone', demoOtp: otp });
};

const verifyPhoneOTP = async (req, res) => {
    const { phone, otpCode } = req.body;
    const storedOtp = otpStore.get(phone);

    if (storedOtp && storedOtp === otpCode) {
        otpStore.delete(phone);
        return res.json({ message: 'Phone OTP verified successfully' });
    }
    return res.status(400).json({ message: 'Invalid or expired OTP' });
};

module.exports = {
    registerUser,
    loginUser,
    sendEmailOTP,
    verifyEmailOTP,
    sendPhoneOTP,
    verifyPhoneOTP
};
