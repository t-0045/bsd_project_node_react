const auth = require('../auth')
const userModel = require('../models/User')

const sendTokens = (response, result) => {
    auth.setRefreshCookie(response, result.refreshToken)
    return response.status(200).json({ accessToken: result.accessToken, user: result.user })
}

const register = async (request, response, next) => {
    try {
        return sendTokens(response, await auth.register(request.body))
    } catch (error) {
        return next(error)
    }
}

const login = async (request, response, next) => {
    try {
        return sendTokens(response, await auth.login(request.body))
    } catch (error) {
        return next(error)
    }
}

const refresh = async (request, response, next) => {
    try {
        return sendTokens(response, await auth.refresh(request.cookies[auth.refreshCookieName]))
    } catch (error) {
        return next(error)
    }
}

const logout = async (request, response) => {
    await auth.logout(request.user.id)
    response.clearCookie(auth.refreshCookieName)
    return response.status(204).send()
}

const me = async (request, response) => {
    try {
        const user = await userModel.findOne({ id: request.user.id }).lean()
        return response.json({ user: user ? auth.publicUser(user) : null })
    } catch (error) {
        console.error('Me error:', error)
        response.status(500).json({ error: 'Failed to fetch user' })
    }
}

module.exports = { register, login, refresh, logout, me }
