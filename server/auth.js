const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const userModel = require('./models/User')

const accessSecret = process.env.ACCESS_TOKEN_SECRET || 'development-access-secret'
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'development-refresh-secret'
const refreshCookieName = 'refreshToken'
const verificationTokenLifetime = 60 * 60 * 1000

const publicUser = (user) => {
    const userObject = user.toObject ? user.toObject() : user
    const { passwordHash, refreshTokenHash, ...safeUser } = userObject
    return safeUser
}

const issueTokens = (user) => {
    const accessToken = jwt.sign({ id: user.id, role: user.role }, accessSecret, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ id: user.id, tokenId: crypto.randomUUID() }, refreshSecret, { expiresIn: '7d' })
    return { accessToken, refreshToken }
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const sendVerificationEmail = async (user, token) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.warn('Gmail is not configured. Set SMTP_USER and SMTP_PASSWORD in server/.env')
        return
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    })

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'קוד אימות לאימייל',
        text: `קוד האימות שלך הוא: ${token}\n\nהקוד תקף למשך 10 דקות.`,
        html: `<p>קוד האימות שלך הוא:</p><h1>${token}</h1><p>הקוד תקף למשך 10 דקות.</p>`
    })
}

const createVerificationToken = () => String(crypto.randomInt(100000, 1000000))

const register = async ({ email, password, businessName }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || !password || !businessName) {
        const error = new Error('email, password and businessName are required')
        error.status = 400
        throw error
    }
    if (typeof password !== 'string' || password.length < 8) {
        const error = new Error('Password must be at least 8 characters long')
        error.status = 400
        throw error
    }

    if (await userModel.findOne({ email: normalizedEmail })) {
        const error = new Error('Email is already registered')
        error.status = 409
        throw error
    }

    const verificationToken = createVerificationToken()
    const user = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        businessName: String(businessName).trim(),
        role: 'USER',
        emailVerified: false,
        emailVerificationTokenHash: hashToken(verificationToken),
        emailVerificationExpiresAt: new Date(Date.now() + verificationTokenLifetime),
        refreshTokenHash: null
    }
    const createdUser = await userModel.create(user)
    await sendVerificationEmail(createdUser, verificationToken)
    return { user: publicUser(createdUser) }
}

const login = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const user = await userModel.findOne({ email: normalizedEmail }).lean()
    if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
        const error = new Error('Invalid email or password')
        error.status = 401
        throw error
    }
    // Email verification is currently optional; keep this block for later enforcement.
    // if (!user.emailVerified) {
    //     const error = new Error('Please verify your email before logging in')
    //     error.status = 403
    //     throw error
    // }

    const tokens = issueTokens(user)
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12)
    await userModel.updateOne({ id: user.id }, { $set: { refreshTokenHash } })
    return { user: publicUser({ ...user, refreshTokenHash }), ...tokens }
}

const verifyEmail = async (email, token) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || !/^\d{6}$/.test(String(token || ''))) {
        const error = new Error('Verification token is required')
        error.status = 400
        throw error
    }

    const user = await userModel.findOne({
        email: normalizedEmail,
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: { $gt: new Date() }
    })
    if (!user) {
        const error = new Error('Invalid or expired verification token')
        error.status = 400
        throw error
    }

    user.emailVerified = true
    user.emailVerificationTokenHash = null
    user.emailVerificationExpiresAt = null
    await user.save()
    return publicUser(user)
}

const refresh = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error('Refresh token is required')
        error.status = 401
        throw error
    }

    let payload
    try {
        payload = jwt.verify(refreshToken, refreshSecret)
    } catch {
        const error = new Error('Invalid or expired refresh token')
        error.status = 401
        throw error
    }

    const user = await userModel.findOne({ id: payload.id }).lean()
    if (!user || !user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
        const error = new Error('Invalid or expired refresh token')
        error.status = 401
        throw error
    }

    const tokens = issueTokens(user)
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12)
    await userModel.updateOne({ id: user.id }, { $set: { refreshTokenHash } })
    return { user: publicUser({ ...user, refreshTokenHash }), ...tokens }
}

const logout = async (userId) => {
    await userModel.updateOne({ id: userId }, { $set: { refreshTokenHash: null } })
}

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await userModel.findOne({ id: userId })
    if (!user || !(await bcrypt.compare(String(currentPassword || ''), user.passwordHash))) {
        const error = new Error('Current password is incorrect')
        error.status = 400
        throw error
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        const error = new Error('New password must be at least 8 characters long')
        error.status = 400
        throw error
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    await user.save()
}

const setRefreshCookie = (response, token) => {
    response.cookie(refreshCookieName, token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

module.exports = {
    refreshCookieName,
    register,
    login,
    verifyEmail,
    refresh,
    logout,
    changePassword,
    setRefreshCookie,
    publicUser,
    accessSecret
}
