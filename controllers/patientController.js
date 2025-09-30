const Patient = require("../models/Patient");
const Visit = require("../models/Visit");

// Add a new patient
exports.addPatient = async (req, res) => {
    try {
        const phone = (req.body.phone || "").trim();
        if (!phone) return res.status(400).json({ message: "Phone is required" });

        const existing = await Patient.findOne({ phone });
        if (existing) return res.status(409).json({ message: "Phone already exists" });

        const patient = new Patient({ ...req.body, phone });
        await patient.save();

        res.status(201).json({ message: "Patient added successfully", patient });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: "Phone already exists" });
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get all patients with search & pagination
exports.getPatients = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;
        const query = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ],
        };

        const total = await Patient.countDocuments(query);
        const patients = await Patient.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Patients fetched successfully",
            patients,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get patient by ID
exports.getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        res.status(200).json({ message: "Patient fetched successfully", patient });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Update patient
exports.updatePatient = async (req, res) => {
    try {
        const updated = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: "Patient not found" });

        res.status(200).json({ message: "Patient updated successfully", patient: updated });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: "Phone already exists" });
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Delete patient
exports.deletePatient = async (req, res) => {
    try {
        const deleted = await Patient.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Patient not found" });

        res.status(200).json({ message: "Patient deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Full details by phone
exports.getPatientFullDetailsByPhone = async (req, res) => {
    try {
        const phone = (req.query.phone || "").trim();
        if (!phone) return res.status(400).json({ message: "Phone is required" });

        const patient = await Patient.findOne({ phone }).lean();
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        const visits = await Visit.find({ patient: patient._id })
            .sort({ visitDate: -1 })
            .lean();

        res.status(200).json({
            message: "Patient details fetched successfully",
            patient,
            visits
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Full details by ID
exports.getPatientFullDetailsById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).lean();
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        const visits = await Visit.find({ patient: patient._id })
            .sort({ visitDate: -1 })
            .lean();

        res.status(200).json({
            message: "Patient details fetched successfully",
            patient,
            visits
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
