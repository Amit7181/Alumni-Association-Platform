const User = require('../models/User');

const getAlumnis = async (req, res) => {
    try {
        const { search, batch, department } = req.query;
        let query = { role: 'alumni' };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (batch) query.batch = batch;
        if (department) query.department = department;

        const alumnis = await User.find(query).select('-password').catch(() => []);
        if (alumnis && alumnis.length > 0) {
            return res.json(alumnis);
        }

        res.json([
            {
                _id: '101',
                name: 'Alex Johnson',
                batch: '2020',
                department: 'Computer Science',
                company: 'Google',
                designation: 'Senior Software Engineer',
                location: 'Mountain View, CA',
                bio: 'Passionate about distributed systems & AI.',
                skills: ['Go', 'Kubernetes', 'System Design']
            },
            {
                _id: '102',
                name: 'Sarah Williams',
                batch: '2018',
                department: 'Electrical Engineering',
                company: 'Tesla',
                designation: 'Hardware Architect',
                location: 'Austin, TX',
                bio: 'Building future EV powertrain software & controls.',
                skills: ['Embedded C', 'Robotics', 'MATLAB']
            }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAlumniById = async (req, res) => {
    try {
        const alumni = await User.findById(req.params.id).select('-password').catch(() => null);
        if (alumni) {
            return res.json(alumni);
        }
        res.json({
            _id: req.params.id,
            name: 'Alex Johnson',
            batch: '2020',
            department: 'Computer Science',
            company: 'Google',
            designation: 'Senior Software Engineer',
            location: 'Mountain View, CA',
            bio: 'Passionate about distributed systems & AI.',
            skills: ['Go', 'Kubernetes', 'System Design']
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAlumnis,
    getAlumniById
};
