// controllers/analytics.js (or wherever)
const Visit = require("../models/Visit");

exports.analytics = async (req, res) => {
    try {
        const today = new Date();
        const startToday = new Date(today);
        startToday.setHours(0, 0, 0, 0);
        const endToday = new Date(today);
        endToday.setHours(23, 59, 59, 999);

        // --- LAST 7 DAYS (group by date) ---
        const last7Start = new Date(startToday);
        last7Start.setDate(startToday.getDate() - 6); // 6 days back + today = 7 days

        const last7Agg = await Visit.aggregate([
            { $match: { visitDate: { $gte: last7Start, $lte: endToday } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitDate" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const last7Map = new Map(last7Agg.map((r) => [r._id, r.count]));
        const dailyVisitsTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(startToday);
            d.setDate(startToday.getDate() - i);
            const key = d.toISOString().split("T")[0]; // "YYYY-MM-DD"
            dailyVisitsTrend.push({ date: key, count: last7Map.get(key) || 0 });
        }

        // --- LAST 6 MONTHS (group by YYYY-MM) ---
        const monthlyVisitsCount = [];
        const earliestMonthStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);

        const monthsAgg = await Visit.aggregate([
            { $match: { visitDate: { $gte: earliestMonthStart, $lte: endToday } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$visitDate" } }, // "YYYY-MM"
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const monthsMap = new Map(monthsAgg.map((r) => [r._id, r.count]));
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            // keep same month format as your old frontend parsing: "YYYY-M" (non padded) is fine for parseInt, but we also try the padded form.
            const padded = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // "YYYY-MM"
            const unpadded = `${d.getFullYear()}-${d.getMonth() + 1}`; // "YYYY-M"
            const count = monthsMap.get(padded) ?? monthsMap.get(unpadded) ?? 0;
            monthlyVisitsCount.push({ month: `${d.getFullYear()}-${d.getMonth() + 1}`, count });
        }

        // --- TODAY STATS: unique patients today and new patients (firstVisit in today) ---
        const todayUniqueAgg = await Visit.aggregate([
            { $match: { visitDate: { $gte: startToday, $lte: endToday } } },
            { $group: { _id: "$patient" } },
            { $count: "total" },
        ]);
        const todayTotal = todayUniqueAgg[0]?.total || 0;

        const todayNewAgg = await Visit.aggregate([
            { $group: { _id: "$patient", firstVisit: { $min: "$visitDate" } } },
            { $match: { firstVisit: { $gte: startToday, $lte: endToday } } },
            { $count: "total" },
        ]);
        const todayNew = todayNewAgg[0]?.total || 0;

        // --- MONTH STATS (unique patients in month + new patients this month) ---
        const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthUniqueAgg = await Visit.aggregate([
            { $match: { visitDate: { $gte: startMonth, $lte: endMonth } } },
            { $group: { _id: "$patient" } },
            { $count: "total" },
        ]);
        const monthTotal = monthUniqueAgg[0]?.total || 0;

        const monthNewAgg = await Visit.aggregate([
            { $group: { _id: "$patient", firstVisit: { $min: "$visitDate" } } },
            { $match: { firstVisit: { $gte: startMonth, $lte: endMonth } } },
            { $count: "total" },
        ]);
        const monthNew = monthNewAgg[0]?.total || 0;

        // --- Lifetime repeat vs unique patients ---
        const totalVisits = await Visit.countDocuments();
        const uniquePatientsAgg = await Visit.aggregate([
            { $group: { _id: "$patient" } },
            { $count: "total" },
        ]);
        const uniquePatientsCount = uniquePatientsAgg[0]?.total || 0;
        const repeatVisits = Math.max(0, totalVisits - uniquePatientsCount);
        const newVisits = uniquePatientsCount; // number of unique patients (lifetime)

        return res.json({
            dailyVisitsTrend,
            monthlyVisitsCount,
            repeatVsNew: { repeatVisits, newVisits },
            todayStats: { total: todayTotal, new: todayNew },
            monthStats: { total: monthTotal, new: monthNew },
        });
    } catch (err) {
        console.error("analytics error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
