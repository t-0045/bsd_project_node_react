const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const userModel = require('./models/User')

const accessSecret = process.env.ACCESS_TOKEN_SECRET || 'development-access-secret'
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'development-refresh-secret'
const refreshCookieName = 'refreshToken'

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

const register = async ({ email, password, businessName }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || !password || !businessName) {
        const error = new Error('email, password and businessName are required')
        error.status = 400
        throw error
    }

    if (await userModel.findOne({ email: normalizedEmail })) {
        const error = new Error('Email is already registered')
        error.status = 409
        throw error
    }

    const user = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        businessName: String(businessName).trim(),
        role: 'USER',
        refreshTokenHash: null
    }
    const tokens = issueTokens(user)
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12)
    const createdUser = await userModel.create(user)
    return { user: publicUser(createdUser), ...tokens }
}

const login = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const user = await userModel.findOne({ email: normalizedEmail }).lean()
    if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
        const error = new Error('Invalid email or password')
        error.status = 401
        throw error
    }

    const tokens = issueTokens(user)
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12)
    await userModel.updateOne({ id: user.id }, { $set: { refreshTokenHash } })
    return { user: publicUser({ ...user, refreshTokenHash }), ...tokens }
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
    refresh,
    logout,
    setRefreshCookie,
    publicUser,
    accessSecret
}
