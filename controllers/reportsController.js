const Visit = require("../models/Visit");
const Patient = require("../models/Patient");

// 1. Daily Visits Report
exports.dailyVisitsReport = async (req, res) => {
    try {
        const { date } = req.query;
        console.log(date)
        if (!date) return res.status(400).json({ message: "Date required" });

        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end = new Date(date); end.setHours(23, 59, 59, 999);

        const visits = await Visit.find({ visitDate: { $gte: start, $lte: end } }).populate("patient");
        res.json({ message: "Daily visits fetched", visits });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// 2. Monthly Visits Report
exports.monthlyVisitsReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ message: "Month and year required" });

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const visits = await Visit.find({ visitDate: { $gte: start, $lte: end } }).populate("patient");
        res.json({ message: "Monthly visits fetched", visits });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};






