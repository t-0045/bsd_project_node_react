const crypto = require('crypto')
const userModel = require('../models/User')
const { getEffectivePicklists } = require('../config/picklists')

const picklistFields = {
    customers: { status: 'customerStatus' },
    appointments: { status: 'appointmentStatus' },
    tasks: { priority: 'taskPriority', status: 'taskStatus' }
}

const requiredFieldNames = {
    customers: 'customer',
    tasks: 'task',
    appointments: 'appointment'
}
const defaultRequiredFields = {
    customer: ['fullName'],
    task: ['title'],
    appointment: ['customerId', 'title']
}
const allowedRequiredFields = {
    customer: ['fullName', 'phone', 'email', 'notes'],
    task: ['title', 'customerId', 'notes'],
    appointment: ['title', 'customerId', 'location']
}

const validateRequiredFields = async (model, body, userId, existingRecord = {}) => {
    const objectType = requiredFieldNames[model.collection.name]
    if (!objectType) return null
    const user = await userModel.findOne({ id: userId }).select('requiredFields').lean()
    const requiredFields = Object.hasOwn(user?.requiredFields || {}, objectType)
        ? user.requiredFields[objectType]
        : defaultRequiredFields[objectType]
    const values = { ...existingRecord, ...body }
    const missingField = requiredFields.find((field) => values[field] === undefined || values[field] === null || String(values[field]).trim() === '')
    return missingField ? `${missingField} is required` : null
}

const findOwned = async (model, id, userId, includeDeleted = false) => {
    return await model.findOne({
        id,
        userId,
        ...(includeDeleted ? {} : { isDeleted: { $ne: true } })
    }).lean()
}

const listOwned = async (model, userId) => {
    return await model.find({
        userId,
        $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]
    }).lean()
}

const validatePicklists = async (model, body, userId) => {
    const collectionFields = picklistFields[model.collection.name] || {}
    const user = await userModel.findOne({ id: userId }).select('picklists').lean()
    const picklists = getEffectivePicklists(user?.picklists)
    for (const [field, picklistKey] of Object.entries(collectionFields)) {
        if (body[field] === undefined) continue
        const values = picklists[picklistKey].map((option) => option.value)
        if (!values.includes(body[field])) {
            return `Invalid ${field}`
        }
    }
    return null
}

const list = (model) => {
    return async (req, res) => {
        try {
            res.json(await listOwned(model, req.user.id))
        } catch (error) {
            console.error('List error:', error)
            res.status(500).json({ error: 'Failed to fetch records' })
        }
    }
}

const get = (model) => {
    return async (req, res) => {
        try {
            const record = await findOwned(model, req.params.id, req.user.id)
            if (!record) {
                return res.status(404).send('Not found')
            }
            res.json(record)
        } catch (error) {
            console.error('Get error:', error)
            res.status(500).json({ error: 'Failed to fetch record' })
        }
    }
}

const create = (model, buildRecord, relation) => {
    return async (req, res) => {
        try {
            const picklistError = await validatePicklists(model, req.body, req.user.id)
            if (picklistError) {
                return res.status(400).json({ error: picklistError })
            }
            const requiredFieldError = await validateRequiredFields(model, req.body, req.user.id)
            if (requiredFieldError) return res.status(400).json({ error: requiredFieldError })

            const relationId = relation && relation.id(req)
            const relationExists = relationId && await findOwned(relation.collection, relationId, req.user.id)
            const relationIsValid = relation && relation.validate
                ? await relation.validate(relationId, req.user.id)
                : relationExists
            if (relationId && !relationIsValid) {
                return res.status(400).json({ error: `${relation.label} not found` })
            }

            const record = await model.create({
                id: crypto.randomUUID(),
                ...buildRecord(req.body, req.user.id)
            })
            res.status(201).json(record)
        } catch (error) {
            console.error('Create error:', error)
            res.status(500).json({ error: 'Failed to create record' })
        }
    }
}

const updateRecord = (model, protectedFields) => {
    return async (req, res) => {
        try {
            const record = await findOwned(model, req.params.id, req.user.id)
            if (!record) {
                return res.status(404).send('Not found')
            }

            const picklistError = await validatePicklists(model, req.body, req.user.id)
            if (picklistError) {
                return res.status(400).json({ error: picklistError })
            }
            const requiredFieldError = await validateRequiredFields(model, req.body, req.user.id, record)
            if (requiredFieldError) return res.status(400).json({ error: requiredFieldError })

            const changes = Object.keys(req.body)
                .filter((field) => !protectedFields.includes(field))
                .reduce((updates, field) => ({ ...updates, [field]: req.body[field] }), {})
            const updatedRecord = await model.findOneAndUpdate(
                { id: record.id, userId: record.userId },
                { $set: changes },
                { new: true }
            ).lean()
            res.json(updatedRecord)
        } catch (error) {
            console.error('Update error:', error)
            res.status(500).json({ error: 'Failed to update record' })
        }
    }
}

const removeRecord = (model, soft = false) => {
    return async (req, res) => {
        try {
            const record = await findOwned(model, req.params.id, req.user.id)
            if (!record) {
                return res.status(404).send('Not found')
            }

            const filter = { id: record.id, userId: record.userId }
            if (soft) {
                await model.updateOne(filter, { $set: { isDeleted: true } })
            } else {
                await model.deleteOne(filter)
            }
            res.send('success')
        } catch (error) {
            console.error('Delete error:', error)
            res.status(500).json({ error: 'Failed to delete record' })
        }
    }
}

module.exports = { list, get, create, updateRecord, removeRecord }
