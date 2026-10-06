const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    backupEmails: {
        type: [{ type: String, lowercase: true, trim: true }],
        default: []
    },
    phoneNumbers: {
        type: [{ type: String, trim: true }],
        default: []
    },
    accessTokenDurationMinutes: {
        type: Number,
        enum: [5, 15, 30, 60, 120],
        default: 15
    },
    calendarStartHour: {
        type: Number,
        min: 0,
        max: 23,
        default: 0
    },
    calendarEndHour: {
        type: Number,
        min: 1,
        max: 24,
        default: 24
    },
    includeSubtaskTimers: {
        type: Boolean,
        default: true
    },
    duplicateCustomerFields: {
        type: [{ type: String, enum: ['phone', 'email'] }],
        default: ['phone', 'email']
    },
    duplicateCustomerMode: {
        type: String,
        enum: ['WARN', 'BLOCK'],
        default: 'WARN'
    },
    picklists: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    requiredFields: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    passwordHash: {
        type: String,
        required: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    profileImage: {
        type: String,
        default: null
    },
    role: {
        type: String,
        default: 'USER'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationTokenHash: {
        type: String,
        default: null
    },
    emailVerificationExpiresAt: {
        type: Date,
        default: null
    },
    refreshTokenHash: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('User', UserSchema)
