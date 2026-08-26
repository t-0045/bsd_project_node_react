const mongoose = require('mongoose')

const AppointmentSchema = new mongoose.Schema({
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
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        required: true,
        enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED']
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Appointment', AppointmentSchema)
