const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_jwt_key_12345', {
        expiresIn: '30d',
    });
};

module.exports = generateToken;
