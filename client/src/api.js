import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:2604/api',
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
  localStorage.setItem('accessToken', data.accessToken)
  return data.user
}

const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me')
  return data.user
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

const getTimers = async () => {
  const { data } = await api.get('/timers')
  return data
}

const createTimer = async (timer) => {
  const { data } = await api.post('/timers', timer)
  return data
}

const updateTimer = async (id, timer) => {
  const { data } = await api.patch(`/timers/${id}`, timer)
  return data
}

const deleteTimer = async (id) => api.delete(`/timers/${id}`)
const changeTimerStatus = async (id, action) => {
  const { data } = await api.post(`/timers/${id}/${action}`)
  return data
}

export {
  loginUser, registerUser, getCurrentUser, logoutUser, getHealth,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getTasks, createTask, updateTask, deleteTask,
  getAppointments, createAppointment, updateAppointment, deleteAppointment,
  getTimers, createTimer, updateTimer, deleteTimer, changeTimerStatus
}
export default api
