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
    passwordHash: {
        type: String,
        required: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true
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
