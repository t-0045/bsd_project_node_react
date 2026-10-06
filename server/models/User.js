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
