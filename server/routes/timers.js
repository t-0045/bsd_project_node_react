const express = require("express")
const { validateBody } = require("../middleware")
const timerController = require("../controllers/timerController")

const router = express.Router()
router.get("/", timerController.getAllTimers)
router.get("/:id", timerController.getTimerById)
router.post("/", validateBody(["taskId", "title"]), timerController.createTimer)
router.patch("/:id", timerController.updateTimer)
router.delete("/:id", timerController.deleteTimer)
router.post("/:id/start", timerController.startTimer)
router.post("/:id/pause", timerController.pauseTimer)
router.post("/:id/complete", timerController.completeTimer)

module.exports = router
