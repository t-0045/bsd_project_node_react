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
        default: '',
        trim: true
    },
    priority: {
        type: String,
        required: true
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
        required: true
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
