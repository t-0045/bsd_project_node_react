const express = require("express")
const { validateBody, requireAuth } = require("../middleware")
const controller = require("../controllers/authController")

const router = express.Router()
router.post("/register", validateBody(["email", "password", "businessName"]), controller.register)
router.post("/login", validateBody(["email", "password"]), controller.login)
router.post("/refresh", controller.refresh)
router.post("/logout", requireAuth, controller.logout)
router.get("/me", requireAuth, controller.me)

module.exports = router