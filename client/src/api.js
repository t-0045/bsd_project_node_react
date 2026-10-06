import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:1234/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

const loginUser = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials)
  localStorage.setItem('accessToken', data.accessToken)
  return data.user
}

const registerUser = async (details) => {
  const { data } = await api.post('/auth/register', details)
  return data
}

const verifyEmail = async (email, token) => {
  const { data } = await api.post('/auth/verify-email', { email, token })
  return data.user
}

const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me')
  return data.user
}

const updateProfileImage = async (profileImage) => {
  const { data } = await api.patch('/auth/profile-image', { profileImage })
  return data.user
}

const changePassword = async (currentPassword, newPassword) => {
  await api.patch('/auth/password', { currentPassword, newPassword })
}

const updatePersonalDetails = async (details) => {
  const { data } = await api.patch('/auth/profile', details)
  return data.user
}

const updateSystemSettings = async (settings) => {
  const { data } = await api.patch('/auth/system-settings', settings)
  return data.user
}

const getPicklists = async () => {
  const { data } = await api.get('/auth/picklists')
  return data.picklists
}

const updatePicklists = async (picklists) => {
  const { data } = await api.put('/auth/picklists', { picklists })
  return data.picklists
}

const logoutUser = async () => {
  await api.post('/auth/logout')
  localStorage.removeItem('accessToken')
}

const getHealth = async () => {
  const { data } = await api.get('/health')
  return data
}

const getCustomers = async () => {
  const { data } = await api.get('/customers')
  return data
}

const createCustomer = async (customer) => {
  const { data } = await api.post('/customers', customer)
  return data
}

const updateCustomer = async (id, customer) => {
  const { data } = await api.patch(`/customers/${id}`, customer)
  return data
}

const deleteCustomer = async (id) => api.delete(`/customers/${id}`)

const getTasks = async () => {
  const { data } = await api.get('/tasks')
  return data
}

const createTask = async (task) => {
  const { data } = await api.post('/tasks', task)
  return data
}

const updateTask = async (id, task) => {
  const { data } = await api.patch(`/tasks/${id}`, task)
  return data
}

const changeSubtaskTimerStatus = async (taskId, subtaskIndex, action) => {
  const { data } = await api.post(`/tasks/${taskId}/subtasks/${subtaskIndex}/${action}`)
  return data
}

const deleteTask = async (id) => api.delete(`/tasks/${id}`)

const getAppointments = async () => {
  const { data } = await api.get('/appointments')
  return data
}

const createAppointment = async (appointment) => {
  const { data } = await api.post('/appointments', appointment)
  return data
}

const updateAppointment = async (id, appointment) => {
  const { data } = await api.patch(`/appointments/${id}`, appointment)
  return data
}

const deleteAppointment = async (id) => api.delete(`/appointments/${id}`)

export {
  loginUser, registerUser, verifyEmail, getCurrentUser, updateProfileImage, changePassword, updatePersonalDetails, updateSystemSettings, getPicklists, updatePicklists, logoutUser, getHealth,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getTasks, createTask, updateTask, deleteTask, changeSubtaskTimerStatus,
  getAppointments, createAppointment, updateAppointment, deleteAppointment,
}
export default api
