const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access forbidden: User role unidentified' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied: Role '${req.user.role}' is not authorized for this resource` 
            });
        }

        next();
    };
};

module.exports = { allowRoles };
