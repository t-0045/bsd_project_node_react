const mongoose = require('mongoose')

const SubtaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
})

module.exports = mongoose.model('Subtask', SubtaskSchema)
