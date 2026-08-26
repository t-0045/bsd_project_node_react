const resourceController = require("./resourceController")
const customerModel = require("../models/Customer")

const getAllCustomers = resourceController.list(customerModel)
const getCustomerById = resourceController.get(customerModel)
const createCustomer = resourceController.create(customerModel, (body, userId) => ({
    userId,
    fullName: body.fullName,
    phone: body.phone || "",
    email: body.email || "",
    status: body.status,
    notes: body.notes || "",
    isDeleted: false,
    createdAt: new Date().toISOString()
}))
const updateCustomer = resourceController.updateRecord(customerModel, ["userId", "id", "isDeleted", "createdAt"])
const deleteCustomer = resourceController.removeRecord(customerModel, true)

module.exports = { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer }
