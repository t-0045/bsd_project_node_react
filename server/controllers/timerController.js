const crypto = require('crypto')
const resourceController = require('./resourceController')
const timerModel = require('../models/Timer')
const taskModel = require('../models/Task')

const changeTimerStatus = (action) => {
    return async (request, response) => {
        try {
            const timer = await timerModel.findOne({
                id: request.params.id,
                userId: request.user.id
            }).lean()
            if (!timer) {
                return response.status(404).json({ error: 'Timer not found' })
            }

            const now = new Date().toISOString()
            if (action === 'start') {
                if (timer.status === 'RUNNING') {
                    return response.status(409).json({ error: 'Timer is already running' })
                }
                timer.sessions.push({ startedAt: now, stoppedAt: null })
                timer.status = 'RUNNING'
            } else if (action === 'pause') {
                if (timer.status !== 'RUNNING') {
                    return response.status(409).json({ error: 'Timer is not running' })
                }
                stopCurrentSession(timer, now)
                timer.status = 'PAUSED'
            } else {
                if (timer.status === 'RUNNING') {
                    stopCurrentSession(timer, now)
                }
                timer.status = 'COMPLETED'
            }

            const updatedTimer = await timerModel.findOneAndUpdate(
                { id: timer.id, userId: timer.userId },
                {
                    $set: {
                        status: timer.status,
                        sessions: timer.sessions,
                        totalDuration: timer.totalDuration
                    }
                },
                { new: true }
            ).lean()
            response.json(updatedTimer)
        } catch (error) {
            console.error('Timer status change error:', error)
            response.status(500).json({ error: 'Failed to change timer status' })
        }
    }
}

const stopCurrentSession = (timer, stoppedAt) => {
    const session = timer.sessions[timer.sessions.length - 1]
    session.stoppedAt = stoppedAt
    timer.totalDuration += Math.max(0, Math.floor((Date.parse(stoppedAt) - Date.parse(session.startedAt)) / 1000))
}

const getAllTimers = resourceController.list(timerModel)
const getTimerById = resourceController.get(timerModel)
const createTimer = resourceController.create(timerModel, (body, userId) => ({
    id: crypto.randomUUID(),
    userId,
    taskId: body.taskId,
    title: body.title,
    status: 'PAUSED',
    sessions: [],
    totalDuration: 0
}), {
    collection: taskModel,
    id: (request) => request.body.taskId,
    label: 'Task'
})
const updateTimer = resourceController.updateRecord(timerModel, ['userId', 'id', 'createdAt'])
const deleteTimer = resourceController.removeRecord(timerModel)
const startTimer = changeTimerStatus('start')
const pauseTimer = changeTimerStatus('pause')
const completeTimer = changeTimerStatus('complete')

module.exports = { getAllTimers, getTimerById, createTimer, updateTimer, deleteTimer, startTimer, pauseTimer, completeTimer }
