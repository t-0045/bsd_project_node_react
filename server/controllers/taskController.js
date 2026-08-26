const resourceController = require('./resourceController')
const taskModel = require('../models/Task')
const customerModel = require('../models/Customer')

const getAllTasks = resourceController.list(taskModel)
const getTaskById = resourceController.get(taskModel)
const createTask = resourceController.create(taskModel, (body, userId) => ({
    userId,
    customerId: body.customerId || null,
    title: body.title,
    priority: body.priority,
    dueDate: body.dueDate || null,
    status: body.status,
    subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
    isDeleted: false
}), {
    collection: customerModel,
    id: (request) => request.body.customerId,
    validate: async (customerId, userId) => Boolean(await customerModel.findOne({
        id: customerId,
        userId,
        status: 'ACTIVE',
        isDeleted: { $ne: true }
    })),
    label: 'Customer'
})
const updateTask = resourceController.updateRecord(taskModel, ['userId', 'id', 'isDeleted', 'createdAt'])
const deleteTask = resourceController.removeRecord(taskModel, true)

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask }
