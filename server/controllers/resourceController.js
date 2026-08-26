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
    return async (request, response) => {
        try {
            response.json(await listOwned(model, request.user.id))
        } catch (error) {
            console.error('List error:', error)
            response.status(500).json({ error: 'Failed to fetch records' })
        }
    }
}

const get = (model) => {
    return async (request, response) => {
        try {
            const record = await findOwned(model, request.params.id, request.user.id)
            if (!record) {
                return response.status(404).send('Not found')
            }
            response.json(record)
        } catch (error) {
            console.error('Get error:', error)
            response.status(500).json({ error: 'Failed to fetch record' })
        }
    }
}

const create = (model, buildRecord, relation) => {
    return async (request, response) => {
        try {
            const enumError = validateEnums(model, request.body)
            if (enumError) {
                return response.status(400).json({ error: enumError })
            }

            const relationId = relation && relation.id(request)
            const relationExists = relationId && await findOwned(relation.collection, relationId, request.user.id)
            const relationIsValid = relation && relation.validate
                ? await relation.validate(relationId, request.user.id)
                : relationExists
            if (relationId && !relationIsValid) {
                return response.status(400).json({ error: `${relation.label} not found` })
            }

            const record = await model.create({
                id: crypto.randomUUID(),
                ...buildRecord(request.body, request.user.id)
            })
            response.status(201).json(record)
        } catch (error) {
            console.error('Create error:', error)
            response.status(500).json({ error: 'Failed to create record' })
        }
    }
}

const updateRecord = (model, protectedFields) => {
    return async (request, response) => {
        try {
            const record = await findOwned(model, request.params.id, request.user.id)
            if (!record) {
                return response.status(404).send('Not found')
            }

            const enumError = validateEnums(model, request.body)
            if (enumError) {
                return response.status(400).json({ error: enumError })
            }

            const changes = Object.keys(request.body)
                .filter((field) => !protectedFields.includes(field))
                .reduce((updates, field) => ({ ...updates, [field]: request.body[field] }), {})
            const updatedRecord = await model.findOneAndUpdate(
                { id: record.id, userId: record.userId },
                { $set: changes },
                { new: true }
            ).lean()
            response.json(updatedRecord)
        } catch (error) {
            console.error('Update error:', error)
            response.status(500).json({ error: 'Failed to update record' })
        }
    }
}

const removeRecord = (model, soft = false) => {
    return async (request, response) => {
        try {
            const record = await findOwned(model, request.params.id, request.user.id)
            if (!record) {
                return response.status(404).send('Not found')
            }

            const filter = { id: record.id, userId: record.userId }
            if (soft) {
                await model.updateOne(filter, { $set: { isDeleted: true } })
            } else {
                await model.deleteOne(filter)
            }
            response.send('success')
        } catch (error) {
            console.error('Delete error:', error)
            response.status(500).json({ error: 'Failed to delete record' })
        }
    }
}

module.exports = { list, get, create, updateRecord, removeRecord }
