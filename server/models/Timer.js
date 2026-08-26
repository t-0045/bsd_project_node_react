const mongoose = require('mongoose')

const SessionSchema = new mongoose.Schema({
    startedAt: {
        type: String,
        required: true
    },
    stoppedAt: {
        type: String,
        default: null
    }
}, {
    _id: false
})

const TimerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    taskId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        default: 'PAUSED',
        enum: ['PAUSED', 'RUNNING', 'COMPLETED']
    },
    sessions: {
        type: [SessionSchema],
        default: []
    },
    totalDuration: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Timer', TimerSchema)
