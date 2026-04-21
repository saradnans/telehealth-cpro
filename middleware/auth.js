const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const verifyRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role_id)) {
        return res.status(403).json({ error: 'Unauthorised' });
    }
    next();
};

module.exports = { verifyToken, verifyRole };