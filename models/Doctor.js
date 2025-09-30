const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
});

module.exports = mongoose.model("Doctor", doctorSchema);
