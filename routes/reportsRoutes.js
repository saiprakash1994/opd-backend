const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");

// Daily Visits Report
// Example: GET /reports/daily?date=2025-09-24
router.get("/daily", reportsController.dailyVisitsReport);

// Monthly Visits Report
// Example: GET /reports/monthly?month=9&year=2025
router.get("/monthly", reportsController.monthlyVisitsReport);



module.exports = router;
