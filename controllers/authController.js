const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");
const { jwtSecret, refreshSecret } = require("../config/config");

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const doctor = new Doctor({ name, email, password: hashed });
    await doctor.save();
    res.json({ message: "Doctor registered successfully" });
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find doctor by email
        const doctor = await Doctor.findOne({ email });
        if (!doctor)
            return res.status(400).json({ message: "Invalid credentials" });

        // Compare password
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        // Generate tokens
        const accessToken = jwt.sign({ id: doctor._id }, jwtSecret, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: doctor._id }, refreshSecret, { expiresIn: "7d" });

        // Persist refresh token for this user
        await Doctor.updateOne(
            { _id: doctor._id },
            { $push: { refreshTokens: { token: refreshToken } } }
        );

        // Return success message with tokens
        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
            doctor: doctor.name
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: "Missing refresh token" });

        // Verify signature
        const decoded = jwt.verify(refreshToken, refreshSecret);
        const doctor = await Doctor.findById(decoded.id).lean();
        if (!doctor) return res.status(401).json({ message: "Invalid refresh token" });

        // Ensure token is still stored for this user (not revoked)
        const stored = (doctor.refreshTokens || []).some((t) => t.token === refreshToken);
        if (!stored) return res.status(401).json({ message: "Invalid refresh token" });

        // Rotate refresh token: issue a new one and remove the used one
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
        console.error(err);
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};

exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
    try {
        if (!refreshToken) return res.json({ message: "Logged out" });
        // Decode to identify user; ignore errors
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
