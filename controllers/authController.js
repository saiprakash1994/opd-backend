const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");
const { jwtSecret, refreshSecret } = require("../config/config");

// Register new doctor
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const doctor = new Doctor({ name, email, password: hashed });
        await doctor.save();
        res.json({ message: "Doctor registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const doctor = await Doctor.findOne({ email });
        if (!doctor) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const accessToken = jwt.sign({ id: doctor._id }, jwtSecret, { expiresIn: "1d" });
        const refreshToken = jwt.sign({ id: doctor._id }, refreshSecret, { expiresIn: "7d" });

        await Doctor.updateOne(
            { _id: doctor._id },
            { $push: { refreshTokens: { token: refreshToken } } }
        );

        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
            doctor: doctor.name
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Refresh
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: "Missing refresh token" });

        const decoded = jwt.verify(refreshToken, refreshSecret);
        const doctor = await Doctor.findById(decoded.id).lean();
        if (!doctor) return res.status(401).json({ message: "Invalid refresh token" });

        const stored = (doctor.refreshTokens || []).some((t) => t.token === refreshToken);
        if (!stored) return res.status(401).json({ message: "Invalid refresh token" });

        const newAccess = jwt.sign({ id: doctor._id }, jwtSecret, { expiresIn: "15m" });
        const newRefresh = jwt.sign({ id: doctor._id }, refreshSecret, { expiresIn: "7d" });

        await Doctor.updateOne(
            { _id: doctor._id },
            {
                $pull: { refreshTokens: { token: refreshToken } },
                $push: { refreshTokens: { token: newRefresh } },
            }
        );

        res.json({ accessToken: newAccess, refreshToken: newRefresh });
    } catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};

// Validate
exports.validate = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "No token provided" });

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecret);

        const doctor = await Doctor.findById(decoded.id).lean();
        if (!doctor) return res.status(401).json({ message: "Invalid token" });

        res.json({ valid: true, doctor: { id: doctor._id, name: doctor.name } });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Logout
exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
    try {
        if (!refreshToken) return res.json({ message: "Logged out" });
        let userId;
        try {
            const decoded = jwt.verify(refreshToken, refreshSecret);
            userId = decoded.id;
        } catch (_) { }
        if (userId) {
            await Doctor.updateOne(
                { _id: userId },
                { $pull: { refreshTokens: { token: refreshToken } } }
            );
        }
        res.json({ message: "Logged out" });
    } catch (e) {
        res.json({ message: "Logged out" });
    }
};
