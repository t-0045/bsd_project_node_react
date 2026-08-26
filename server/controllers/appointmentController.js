const resourceController = require('./resourceController')
const appointmentModel = require('../models/Appointment')
const customerModel = require('../models/Customer')

const getAllAppointments = resourceController.list(appointmentModel)
const getAppointmentById = resourceController.get(appointmentModel)
const createAppointment = resourceController.create(appointmentModel, (body, userId) => ({
    userId,
    customerId: body.customerId,
    title: body.title,
    startTime: body.startTime,
    endTime: body.endTime,
    location: body.location || '',
    status: body.status
}), {
    collection: customerModel,
    id: (request) => request.body.customerId,
    label: 'Customer'
})
const updateAppointment = resourceController.updateRecord(appointmentModel, ['userId', 'id', 'createdAt'])
const deleteAppointment = resourceController.removeRecord(appointmentModel)

module.exports = { getAllAppointments, getAppointmentById, createAppointment, updateAppointment, deleteAppointment }
