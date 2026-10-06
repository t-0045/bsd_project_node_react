const mongoose = require('mongoose')

const CustomerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        default: '',
        trim: true
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: '',
        lowercase: true,
        trim: true
    },
    status: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Customer', CustomerSchema)
