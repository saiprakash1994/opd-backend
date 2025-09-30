const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    phone: { type: String, trim: true },
    address: { type: String },
    createdAt: { type: Date, default: Date.now },
});

patientSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Patient", patientSchema);
