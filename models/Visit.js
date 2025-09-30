const mongoose = require("mongoose");

// Prescription sub-schema
const prescriptionSchema = new mongoose.Schema({
    photo: { type: String },
    toBeContinued: { type: Boolean, default: false },
    inherited: { type: Boolean, default: false },
    courseDuration: { type: Number, default: 15 }, // days
});

// Visit schema
const visitSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    visitDate: { type: Date, default: Date.now },
    notes: { type: String },
    prescriptions: [prescriptionSchema],
});

module.exports = mongoose.model("Visit", visitSchema);
