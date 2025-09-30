const express = require("express");
const {
    addVisit,
    getVisits,
    getVisitById,
    updateVisit,
} = require("../controllers/visitController");
const verifyToken = require("../middleware/verifyToken");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/", verifyToken, upload.array("photos"), addVisit);
router.get("/", verifyToken, getVisits);
router.get("/:id", verifyToken, getVisitById);
router.put("/:id", verifyToken, upload.array("photos"), updateVisit);

module.exports = router;
