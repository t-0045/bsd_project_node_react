const auth = require('../auth')
const userModel = require('../models/User')
const taskModel = require('../models/Task')

const sendTokens = (res, result) => {
    auth.setRefreshCookie(res, result.refreshToken)
    return res.status(200).json({ accessToken: result.accessToken, user: result.user })
}

const register = async (req, res, next) => {
    try {
        const result = await auth.register(req.body)
        return res.status(201).json(result)
    } catch (error) {
        return next(error)
    }
}

const login = async (req, res, next) => {
    try {
        return sendTokens(res, await auth.login(req.body))
    } catch (error) {
        return next(error)
    }
}

const refresh = async (req, res, next) => {
    try {
        return sendTokens(res, await auth.refresh(req.cookies[auth.refreshCookieName]))
    } catch (error) {
        return next(error)
    }
}

const logout = async (req, res) => {
    await auth.logout(req.user.id)
    res.clearCookie(auth.refreshCookieName)
    return res.status(204).send()
}

const me = async (req, res) => {
    try {
        const user = await userModel.findOne({ id: req.user.id }).lean()
        return res.json({ user: user ? auth.publicUser(user) : null })
    } catch (error) {
        console.error('Me error:', error)
        res.status(500).json({ error: 'Failed to fetch user' })
    }
}

const updateProfileImage = async (req, res, next) => {
    const { profileImage } = req.body
    const imagePattern = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/

    if (profileImage !== null && (typeof profileImage !== 'string' || profileImage.length > 2800000 || !imagePattern.test(profileImage))) {
        const error = new Error('Profile image must be a PNG, JPEG, or WebP image up to 2 MB')
        error.status = 400
        return next(error)
    }

    try {
        const user = await userModel.findOneAndUpdate(
            { id: req.user.id },
            { $set: { profileImage } },
            { new: true, runValidators: true }
        ).lean()
        return res.json({ user: user ? auth.publicUser(user) : null })
    } catch (error) {
        return next(error)
    }
}

const changePassword = async (req, res, next) => {
    try {
        await auth.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword)
        return res.status(204).send()
    } catch (error) {
        return next(error)
    }
}

const updatePersonalDetails = async (req, res, next) => {
    const businessName = typeof req.body.businessName === 'string' ? req.body.businessName.trim() : ''
    const backupEmails = req.body.backupEmails
    const phoneNumbers = req.body.phoneNumbers

    if (!businessName) {
        const error = new Error('Business name is required')
        error.status = 400
        return next(error)
    }
    if (!Array.isArray(backupEmails)) {
        const error = new Error('Backup email addresses must be provided as a list')
        error.status = 400
        return next(error)
    }
    if (!Array.isArray(phoneNumbers)) {
        const error = new Error('Phone numbers must be provided as a list')
        error.status = 400
        return next(error)
    }
    try {
        const currentUser = await userModel.findOne({ id: req.user.id }).select('email').lean()
        const normalizedEmails = backupEmails.map((email) => String(email).trim().toLowerCase())
        const normalizedPhones = phoneNumbers.map((number) => String(number).trim()).filter(Boolean)
        const uniqueEmails = new Set(normalizedEmails)
        const primaryEmail = currentUser?.email.toLowerCase()
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (uniqueEmails.size !== normalizedEmails.length || normalizedEmails.some((email) => !validEmail.test(email) || email === primaryEmail)) {
            const error = new Error('Backup emails must be valid, unique, and different from the primary email')
            error.status = 400
            return next(error)
        }
        const validPhone = /^\+?[0-9().\s-]+$/
        if (normalizedPhones.some((number) => !validPhone.test(number) || number.replace(/\D/g, '').length < 7 || number.replace(/\D/g, '').length > 15)) {
            const error = new Error('Phone numbers must contain 7 to 15 digits and use a valid phone format')
            error.status = 400
            return next(error)
        }

        const user = await userModel.findOneAndUpdate(
            { id: req.user.id },
            { $set: { businessName, backupEmails: normalizedEmails, phoneNumbers: normalizedPhones } },
            { new: true, runValidators: true }
        ).lean()
        return res.json({ user: user ? auth.publicUser(user) : null })
    } catch (error) {
        return next(error)
    }
}

const updateSystemSettings = async (req, res, next) => {
    const updates = {}
    const { includeSubtaskTimers, duplicateCustomerFields, duplicateCustomerMode } = req.body

    if (includeSubtaskTimers !== undefined) {
        if (typeof includeSubtaskTimers !== 'boolean') {
            const error = new Error('Subtask timer preference must be a boolean')
            error.status = 400
            return next(error)
        }
        updates.includeSubtaskTimers = includeSubtaskTimers
    }
    if (duplicateCustomerFields !== undefined) {
        if (!Array.isArray(duplicateCustomerFields) || duplicateCustomerFields.length === 0 || duplicateCustomerFields.length > 2 ||
            duplicateCustomerFields.some((field) => !['phone', 'email'].includes(field)) ||
            new Set(duplicateCustomerFields).size !== duplicateCustomerFields.length) {
            const error = new Error('Select phone, email, or both for duplicate customer matching')
            error.status = 400
            return next(error)
        }
        updates.duplicateCustomerFields = duplicateCustomerFields
    }
    if (duplicateCustomerMode !== undefined) {
        if (!['WARN', 'BLOCK'].includes(duplicateCustomerMode)) {
            const error = new Error('Duplicate customer mode must be WARN or BLOCK')
            error.status = 400
            return next(error)
        }
        updates.duplicateCustomerMode = duplicateCustomerMode
    }
    if (!Object.keys(updates).length) {
        const error = new Error('No system settings were provided')
        error.status = 400
        return next(error)
    }

    try {
        if (updates.includeSubtaskTimers === false) {
            const runningTasks = await taskModel.find({ userId: req.user.id, 'subtasks.status': 'RUNNING' })
            const stoppedAt = new Date().toISOString()
            for (const task of runningTasks) {
                for (const subtask of task.subtasks) {
                    if (subtask.status !== 'RUNNING') continue
                    const session = subtask.sessions[subtask.sessions.length - 1]
                    if (session && !session.stoppedAt) {
                        session.stoppedAt = stoppedAt
                        subtask.totalDuration += Math.max(0, Math.floor((Date.parse(stoppedAt) - Date.parse(session.startedAt)) / 1000))
                    }
                    subtask.status = 'PAUSED'
                }
                await task.save()
            }
        }

        const user = await userModel.findOneAndUpdate(
            { id: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
        ).lean()
        return res.json({ user: user ? auth.publicUser(user) : null })
    } catch (error) {
        return next(error)
    }
}

// אימות מייל מושבת
// const verifyEmail = async (req, res, next) => {
//     try {
//         const user = await auth.verifyEmail(req.body.email, req.body.token)
//         return res.json({ user })
//     } catch (error) {
//         return next(error)
//     }
// }

module.exports = { register, login, refresh, logout, me, updateProfileImage, changePassword, updatePersonalDetails, updateSystemSettings }
