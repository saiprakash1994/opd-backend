const express = require("express");
const {
    addPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientFullDetailsByPhone,
    getPatientFullDetailsById,
} = require("../controllers/patientController");

const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.post("/", verifyToken, addPatient);
router.get("/", verifyToken, getPatients);

router.get("/details-by-phone", verifyToken, getPatientFullDetailsByPhone);
router.get("/details/:id", verifyToken, getPatientFullDetailsById);
router.get("/:id", verifyToken, getPatientById);

router.put("/:id", verifyToken, updatePatient);
router.delete("/:id", verifyToken, deletePatient);


module.exports = router;
