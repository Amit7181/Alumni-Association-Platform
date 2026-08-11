const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alumni_db');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Warning: ${error.message}`);
        console.log('Server running in standalone mode (database will connect once MongoDB service starts).');
    }
};

module.exports = connectDB;
