const express = require("express")
const { validateBody, requireAuth } = require("../middleware")
const controller = require("../controllers/authController")

const router = express.Router()

router.post("/register", validateBody(["email", "password", "businessName"]), controller.register)
router.post("/login", validateBody(["email", "password"]), controller.login)
// router.post("/verify-email", validateBody(["email", "token"]), controller.verifyEmail)
router.post("/refresh", controller.refresh)
router.post("/logout", requireAuth, controller.logout)
router.get("/me", requireAuth, controller.me)
router.patch("/profile-image", requireAuth, controller.updateProfileImage)
router.patch("/password", requireAuth, validateBody(["currentPassword", "newPassword"]), controller.changePassword)
router.patch("/profile", requireAuth, controller.updatePersonalDetails)
router.patch("/system-settings", requireAuth, controller.updateSystemSettings)

module.exports = router