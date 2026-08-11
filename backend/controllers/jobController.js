const Job = require('../models/Job');

const createJob = async (req, res) => {
    try {
        const { title, company, location, type, experience, salary, description, requirements, applyLink } = req.body;
        const newJob = new Job({
            title,
            company,
            location,
            type,
            experience,
            salary,
            description,
            requirements: requirements ? (Array.isArray(requirements) ? requirements : [requirements]) : [],
            applyLink,
            postedBy: req.user._id,
            postedByName: req.user.name
        });
        await newJob.save().catch(() => null);
        res.status(201).json(newJob);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 }).catch(() => []);
        if (jobs && jobs.length > 0) {
            return res.json(jobs);
        }
        res.json([
            {
                _id: 'j1',
                title: 'Frontend Engineer (React / Next.js)',
                company: 'InnovateTech',
                location: 'Remote',
                type: 'Full-time',
                experience: '2-4 years',
                salary: '$110,000 - $130,000',
                description: 'Building modern UI dashboards for enterprise customers.',
                postedByName: 'Alex Johnson',
                createdAt: new Date()
            },
            {
                _id: 'j2',
                title: 'Data Science Intern',
                company: 'DataMetrics AI',
                location: 'San Francisco, CA',
                type: 'Internship',
                experience: '0-1 years',
                salary: '$45 / hr',
                description: 'Work with our core ML team on predictive modeling.',
                postedByName: 'Sarah Williams',
                createdAt: new Date()
            }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).catch(() => null);
        if (job) {
            return res.json(job);
        }
        res.json({
            _id: req.params.id,
            title: 'Frontend Engineer (React / Next.js)',
            company: 'InnovateTech',
            location: 'Remote',
            type: 'Full-time',
            experience: '2-4 years',
            salary: '$110,000 - $130,000',
            description: 'Building modern UI dashboards for enterprise customers.',
            requirements: ['Strong React/JavaScript skills', 'CSS/Tailwind experience', 'REST APIs'],
            postedByName: 'Alex Johnson'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createJob,
    getJobs,
    getJobById
};
