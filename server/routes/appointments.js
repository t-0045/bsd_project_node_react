const express = require("express")
const { validateBody } = require("../middleware")
const appointmentController = require("../controllers/appointmentController")

const router = express.Router()
router.get("/", appointmentController.getAllAppointments)
router.get("/:id", appointmentController.getAppointmentById)
router.post("/", validateBody(["customerId", "title", "startTime", "endTime", "status"]), appointmentController.createAppointment)
router.patch("/:id", appointmentController.updateAppointment)
router.delete("/:id", appointmentController.deleteAppointment)

module.exports = router
