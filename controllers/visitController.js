const Visit = require("../models/Visit");

// Add a new visit
exports.addVisit = async (req, res) => {
    try {
        const { notes, patient, prescriptions, courseDuration, inheritFromPrevious } = req.body;

        // find previous visit if inheritance is requested
        const previousVisit =
            inheritFromPrevious === "true" || inheritFromPrevious === true
                ? await Visit.findOne({ patient }).sort({ createdAt: -1 })
                : null;

        // --- Parse prescriptions ---
        let parsedPrescriptions = [];
        if (prescriptions) {
            try {
                if (Array.isArray(prescriptions)) {
                    parsedPrescriptions = prescriptions;
                } else {
                    parsedPrescriptions = JSON.parse(prescriptions); // already an array
                }
            } catch (err) {
                return res.status(400).json({ message: "Invalid prescriptions format" });
            }
        }

        // --- Normalize prescriptions ---
        parsedPrescriptions = parsedPrescriptions.map((p, i) => {
            const continued = p.toBeContinued === true || p.toBeContinued === "true";

            // 1. prefer uploaded file
            let photo = req.files?.[i] ? `/uploads/${req.files[i].filename}` : null;

            // 2. else, use photo sent from frontend
            if (!photo && p.photo) {
                photo = p.photo;
            }

            // 3. default inherited flag
            let inherited = p.inherited === true || p.inherited === "true" || false;

            // 4. If continued & still no photo, inherit from previous visit
            if (continued && !photo && previousVisit?.prescriptions?.length) {
                const lastPrescription = previousVisit.prescriptions[previousVisit.prescriptions.length - 1];
                if (lastPrescription?.photo) {
                    photo = lastPrescription.photo;
                    inherited = true;
                }
            }

            return {
                toBeContinued: continued,
                photo,
                inherited,
                courseDuration: Number(p.courseDuration) || 15,
            };
        });


        // --- Save visit ---
        const visit = new Visit({
            notes,
            patient,
            prescriptions: parsedPrescriptions,
        });

        await visit.save();

        res.status(201).json({ message: "Visit created", visit });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
// Get visits with optional filters and pagination
exports.getVisits = async (req, res) => {
    try {
        const { patientId, page = 1, limit = 10 } = req.query;
        const query = patientId ? { patient: patientId } : {};

        const total = await Visit.countDocuments(query);
        const visits = await Visit.find(query)
            .populate("patient")
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ visitDate: -1 });

        res.json({
            message: "Visits fetched successfully",
            visits,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get a single visit by ID
exports.getVisitById = async (req, res) => {
    try {
        const visit = await Visit.findById(req.params.id).populate("patient");
        if (!visit) return res.status(404).json({ message: "Visit not found" });

        res.json({ message: "Visit fetched successfully", visit });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Update a visit (notes or add new prescriptions)
exports.updateVisit = async (req, res) => {
    try {
        const { notes, prescriptions, courseDuration } = req.body;
        const visit = await Visit.findById(req.params.id);
        if (!visit) return res.status(404).json({ message: "Visit not found" });

        if (notes) visit.notes = notes;

        if (prescriptions) {
            const parsedPrescriptions = Array.isArray(prescriptions) ? prescriptions : [JSON.parse(prescriptions)];

            const lastVisit = visit;

            const updatedPrescriptions = parsedPrescriptions.map((p, i) => {
                const continued = p.toBeContinued === true || p.toBeContinued === "true";
                let photo = req.files?.[i] ? `/uploads/${req.files[i].filename}` : null;
                let inherited = false;

                if (continued && !photo && lastVisit.prescriptions?.length) {
                    const lastPrescription = lastVisit.prescriptions[lastVisit.prescriptions.length - 1];
                    if (lastPrescription?.photo) {
                        photo = lastPrescription.photo;
                        inherited = true;
                    }
                }

                return {
                    ...p,
                    photo,
                    inherited,
                    toBeContinued: continued,
                    courseDuration: courseDuration ? Number(courseDuration) : 15,
                };
            });

            visit.prescriptions.push(...updatedPrescriptions);
        }

        await visit.save();
        await visit.populate("patient");

        res.json({ message: "Visit updated successfully", visit });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
