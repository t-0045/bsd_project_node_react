const mongoose = require('mongoose')
const SubtaskModel = require('./Subtask')

const TaskSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    customerId: {
        type: String,
        default: null
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    },
    dueDate: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        required: true,
        enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DELETED']
    },
    subtasks: {
        type: [SubtaskModel.schema],
        default: []
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Task', TaskSchema)
