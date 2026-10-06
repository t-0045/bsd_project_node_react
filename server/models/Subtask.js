const mongoose = require('mongoose')

const SubtaskSchema = new mongoose.Schema({
    type: {
        type: String,
        default: null
    },
    title: {
        type: String,
        default: '',
        trim: true
    },
    notes: {
        type: String,
        default: '',
        trim: true
    },
    startDate: {
        type: String,
        required: true
    },
    dueDate: {
        type: String,
        default: null
    },
    completed: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'PAUSED',
        enum: ['PAUSED', 'RUNNING', 'COMPLETED']
    },
    sessions: {
        type: [{
            startedAt: { type: String, required: true },
            stoppedAt: { type: String, default: null }
        }],
        default: []
    },
    totalDuration: {
        type: Number,
        default: 0
    }
}, {
    _id: false
})

module.exports = mongoose.model('Subtask', SubtaskSchema)
