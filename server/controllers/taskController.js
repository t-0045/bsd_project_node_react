const resourceController = require('./resourceController')
const taskModel = require('../models/Task')
const customerModel = require('../models/Customer')
const userModel = require('../models/User')

const validateTaskDates = async (req, res, next) => {
    try {
        const existingTask = req.method === 'PATCH'
            ? await taskModel.findOne({ id: req.params.id, userId: req.user.id }).lean()
            : null
        const taskDue = req.body.dueDate || existingTask?.dueDate
        const due = Date.parse(taskDue)

        if (!Number.isFinite(due)) {
            return res.status(400).json({ error: 'The due date must be valid' })
        }

        const subtasks = Array.isArray(req.body.subtasks) ? req.body.subtasks : existingTask?.subtasks || []
        const invalidSubtask = subtasks.find((subtask) => {
            const subtaskStart = Date.parse(subtask.startDate)
            const subtaskDue = subtask.dueDate ? Date.parse(subtask.dueDate) : null
            return !Number.isFinite(subtaskStart) || subtaskStart < Date.now() || subtaskStart > due ||
                (subtaskDue !== null && (!Number.isFinite(subtaskDue) || subtaskDue <= subtaskStart || subtaskDue < Date.now() || subtaskDue > due))
        })
        if (invalidSubtask) return res.status(400).json({ error: 'Subtask dates must be within the task date range' })
        next()
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate task dates' })
    }
}

const getAllTasks = resourceController.list(taskModel)
const getTaskById = resourceController.get(taskModel)
const createTask = resourceController.create(taskModel, (body, userId) => ({
    userId,
    customerId: body.customerId || null,
    title: body.title,
    priority: body.priority,
    dueDate: body.dueDate,
    notes: body.notes || '',
    status: body.status,
    subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
    isDeleted: false
}), {
    collection: customerModel,
    id: (req) => req.body.customerId,
    validate: async (customerId, userId) => Boolean(await customerModel.findOne({
        id: customerId,
        userId,
        isDeleted: { $ne: true }
    })),
    label: 'Customer'
})
const updateTask = resourceController.updateRecord(taskModel, ['userId', 'id', 'isDeleted', 'createdAt'])
const deleteTask = resourceController.removeRecord(taskModel, true)

const changeSubtaskStatus = (action) => async (req, res) => {
    try {
        const task = await taskModel.findOne({ id: req.params.id, userId: req.user.id })
        const subtaskIndex = Number(req.params.subtaskIndex)
        const subtask = task?.subtasks[subtaskIndex]
        if (!subtask) return res.status(404).json({ error: 'Subtask not found' })

        const now = new Date().toISOString()
        if (action === 'start') {
            const user = await userModel.findOne({ id: req.user.id }).select('includeSubtaskTimers').lean()
            if (user?.includeSubtaskTimers === false) {
                return res.status(403).json({ error: 'Subtask timers are disabled in your settings' })
            }
            if (subtask.status === 'RUNNING') return res.status(409).json({ error: 'Timer is already running' })
            const runningTask = await taskModel.findOne({
                userId: req.user.id,
                'subtasks.status': 'RUNNING'
            }).lean()
            if (runningTask) return res.status(409).json({ error: 'Another timer is already running' })
            subtask.sessions.push({ startedAt: now, stoppedAt: null })
            subtask.status = 'RUNNING'
        } else if (action === 'pause') {
            if (subtask.status !== 'RUNNING') return res.status(409).json({ error: 'Timer is not running' })
            stopSubtaskSession(subtask, now)
            subtask.status = 'PAUSED'
        } else {
            if (subtask.status === 'RUNNING') stopSubtaskSession(subtask, now)
            subtask.status = 'COMPLETED'
        }

        await task.save()
        res.json(task)
    } catch (error) {
        console.error('Subtask timer status change error:', error)
        res.status(500).json({ error: 'Failed to change subtask timer status' })
    }
}

const stopSubtaskSession = (subtask, stoppedAt) => {
    const session = subtask.sessions[subtask.sessions.length - 1]
    session.stoppedAt = stoppedAt
    subtask.totalDuration += Math.max(0, Math.floor((Date.parse(stoppedAt) - Date.parse(session.startedAt)) / 1000))
}

const startSubtaskTimer = changeSubtaskStatus('start')
const pauseSubtaskTimer = changeSubtaskStatus('pause')
const completeSubtaskTimer = changeSubtaskStatus('complete')

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, startSubtaskTimer, pauseSubtaskTimer, completeSubtaskTimer, validateTaskDates }
