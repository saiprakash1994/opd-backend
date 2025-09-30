const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
    });
};
