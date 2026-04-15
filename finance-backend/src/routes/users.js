const express = require("express");
const {
  getUsers,
  getUserDetails,
  createUser,
  updateUser,
  deactivateUser,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  updateUserStatus,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

router.get("/", authorize("ADMIN"), getUsers);
router.post("/", authorize("ADMIN"), createUser);
router.get("/:id", authorize("ADMIN"), getUserDetails);
router.patch("/:id", authorize("ADMIN"), updateUser);
router.delete("/:id", authorize("ADMIN"), deactivateUser);
router.patch("/:id/role", authorize("ADMIN"), updateUserRole);
router.patch("/:id/status", authorize("ADMIN"), updateUserStatus);

module.exports = router;
