const { verifyToken } = require('../auth/jwt');
const blacklist = require('../data/blacklist');

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: "No token"
        });
    }

    const token = authHeader.split(" ")[1];

    // NEW CHECK
    if (blacklist.includes(token)) {
        return res.status(401).json({
            error: "Token has been revoked"
        });
    }

    try {

        const decoded = verifyToken(token);

        req.user = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            error: "Invalid token"
        });

    }

};