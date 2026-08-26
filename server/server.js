require('dotenv').config()

const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const corsOptions = require('./config/corsOptions')
const { requireAuth } = require('./middleware')
const authRoutes = require('./routes/auth')
const customerRoutes = require('./routes/customers')
const appointmentRoutes = require('./routes/appointments')
const taskRoutes = require('./routes/tasks')
const timerRoutes = require('./routes/timers')

const app = express()
const port = process.env.PORT || 3001

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (request, response) => response.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/customers', requireAuth, customerRoutes)
app.use('/api/appointments', requireAuth, appointmentRoutes)
app.use('/api/tasks', requireAuth, taskRoutes)
app.use('/api/timers', requireAuth, timerRoutes)

app.use((error, request, response, next) => response.status(error.status || 500).json({ error: error.message || 'Internal server error' }))

if (require.main === module) {
    const startServer = async () => {
        try {
            const uri = process.env.DATABASE_URI || 'mongodb://localhost:27017/bsd_project'
            await mongoose.connect(uri)
            console.log(`MongoDB connected to ${uri}`)
            app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
        } catch (error) {
            console.error('MongoDB connection failed:', error.message)
            process.exit(1)
        }
    }
    startServer()
}

module.exports = app
