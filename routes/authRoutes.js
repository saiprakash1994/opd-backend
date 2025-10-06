const express = require("express");
const { register, login, refresh, logout, validate } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/validate", validate);


module.exports = router;
