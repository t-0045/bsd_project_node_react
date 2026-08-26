const express = require("express")
const { validateBody } = require("../middleware")
const taskController = require("../controllers/taskController")

const router = express.Router()
router.get("/", taskController.getAllTasks)
router.get("/:id", taskController.getTaskById)
router.post("/", validateBody(["title", "priority", "status", "dueDate"]), taskController.validateTaskDates, taskController.createTask)
router.patch("/:id", taskController.validateTaskDates, taskController.updateTask)
router.delete("/:id", taskController.deleteTask)
router.post("/:id/subtasks/:subtaskIndex/start", taskController.startSubtaskTimer)
router.post("/:id/subtasks/:subtaskIndex/pause", taskController.pauseSubtaskTimer)
router.post("/:id/subtasks/:subtaskIndex/complete", taskController.completeSubtaskTimer)

module.exports = router
