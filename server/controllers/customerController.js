const resourceController = require("./resourceController")
const customerModel = require("../models/Customer")
const userModel = require("../models/User")
const { getEffectivePicklists } = require('../config/picklists')

const getAllCustomers = resourceController.list(customerModel)
const getCustomerById = resourceController.get(customerModel)
const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '')
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const createCustomer = async (req, res) => {
    try {
        const user = await userModel.findOne({ id: req.user.id }).select('duplicateCustomerFields duplicateCustomerMode picklists requiredFields').lean()
        const customerStatusValues = getEffectivePicklists(user?.picklists).customerStatus.map((option) => option.value)
        if (!customerStatusValues.includes(req.body.status)) {
            return res.status(400).json({ error: 'Invalid status' })
        }
        const requiredFields = Object.hasOwn(user?.requiredFields || {}, 'customer')
            ? user.requiredFields.customer
            : ['fullName']
        const missingRequiredField = requiredFields.find((field) => (
            req.body[field] === undefined || req.body[field] === null || String(req.body[field]).trim() === ''
        ))
        if (missingRequiredField) return res.status(400).json({ error: `${missingRequiredField} is required` })
        const matchingFields = user?.duplicateCustomerFields?.length ? user.duplicateCustomerFields : ['phone', 'email']
        const duplicateMode = user?.duplicateCustomerMode || 'WARN'
        const phone = normalizePhone(req.body.phone)
        const email = normalizeEmail(req.body.email)
        const query = { userId: req.user.id, isDeleted: { $ne: true }, $or: [] }

        if (matchingFields.includes('phone') && phone) query.$or.push({ phone: { $exists: true, $ne: '' } })
        if (matchingFields.includes('email') && email) query.$or.push({ email: { $exists: true, $ne: '' } })

        let matches = []
        if (query.$or.length) {
            const existingCustomers = await customerModel.find(query).select('id fullName phone email').lean()
            matches = existingCustomers.filter((existing) => (
                (matchingFields.includes('phone') && phone && normalizePhone(existing.phone) === phone) ||
                (matchingFields.includes('email') && email && normalizeEmail(existing.email) === email)
            ))
        }

        if (matches.length && duplicateMode === 'BLOCK') {
            return res.status(409).json({
                code: 'DUPLICATE_CUSTOMER_BLOCKED',
                error: 'A customer with the same phone number or email already exists',
                matches
            })
        }
        if (matches.length && req.body.allowDuplicate !== true) {
            return res.status(409).json({
                code: 'DUPLICATE_CUSTOMER_WARNING',
                error: 'A customer with the same phone number or email may already exist',
                matches
            })
        }

        const createdCustomer = await customerModel.create({
            id: require('crypto').randomUUID(),
            userId: req.user.id,
            fullName: req.body.fullName,
            phone: req.body.phone || '',
            email: req.body.email || '',
            status: req.body.status,
            notes: req.body.notes || '',
            isDeleted: false,
            createdAt: new Date().toISOString()
        })
        return res.status(201).json(createdCustomer)
    } catch (error) {
        console.error('Create customer error:', error)
        return res.status(500).json({ error: 'Failed to create customer' })
    }
}
const updateCustomer = resourceController.updateRecord(customerModel, ["userId", "id", "isDeleted", "createdAt"])
const deleteCustomer = resourceController.removeRecord(customerModel, true)

module.exports = { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer }
