const crypto = require('crypto')

const enums = {
    customers: { status: ['LEAD', 'ACTIVE', 'INACTIVE'] },
    appointments: { status: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] },
    tasks: {
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        status: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DELETED']
    }
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

const validateEnums = (model, body) => {
    const collectionEnums = enums[model.collection.name] || {}
    for (const [field, values] of Object.entries(collectionEnums)) {
        if (body[field] !== undefined && !values.includes(body[field])) {
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
            const enumError = validateEnums(model, req.body)
            if (enumError) {
                return res.status(400).json({ error: enumError })
            }

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

            const enumError = validateEnums(model, req.body)
            if (enumError) {
                return res.status(400).json({ error: enumError })
            }

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
