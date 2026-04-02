const express = require("express");
const { getUsers, updateUserRole, updateUserStatus } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/", getUsers);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", updateUserStatus);

module.exports = router;
