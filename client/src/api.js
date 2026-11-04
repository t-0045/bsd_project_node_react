import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:2604/api',
  withCredentials: true,
})

const apiErrorTranslations = {
  'email, password and businessName are required': 'יש למלא כתובת אימייל, סיסמה ושם עסק',
  'Password must be at least 8 characters long': 'הסיסמה חייבת להכיל לפחות 8 תווים',
  'Email is already registered': 'כתובת האימייל כבר רשומה במערכת',
  'Invalid email or password': 'כתובת האימייל או הסיסמה שגויות',
  'Verification token is required': 'יש להזין קוד אימות',
  'Invalid or expired verification token': 'קוד האימות שגוי או שפג תוקפו',
  'Refresh token is required': 'נדרש טוקן התחברות מחדש',
  'Invalid or expired refresh token': 'טוקן ההתחברות שגוי או שפג תוקפו',
  'Current password is incorrect': 'הסיסמה הנוכחית שגויה',
  'New password must be at least 8 characters long': 'הסיסמה החדשה חייבת להכיל לפחות 8 תווים',
  'Access token is required': 'נדרש טוקן גישה',
  'Invalid or expired access token': 'טוקן הגישה שגוי או שפג תוקפו',
  'Business name is required': 'יש להזין שם עסק',
  'Backup email addresses must be provided as a list': 'יש להזין את כתובות האימייל לגיבוי כרשימה',
  'Phone numbers must be provided as a list': 'יש להזין את מספרי הטלפון כרשימה',
  'Access token duration must be 5, 15, 30, 60, or 120 minutes': 'יש לבחור תוקף של 5, 15, 30, 60 או 120 דקות',
  'Backup emails must be valid, unique, and different from the primary email': 'כתובות האימייל לגיבוי חייבות להיות תקינות, ייחודיות ושונות מהאימייל הראשי',
  'Phone numbers must contain 7 to 15 digits and use a valid phone format': 'מספרי הטלפון חייבים להכיל 7 עד 15 ספרות ולהיות בפורמט תקין',
  'Profile image must be a PNG, JPEG, or WebP image up to 2 MB': 'תמונת הפרופיל חייבת להיות מסוג PNG, JPEG או WebP ובגודל של עד 2MB',
  'The due date must be valid': 'יש להזין תאריך יעד תקין',
  'Subtask dates must be within the task date range': 'תאריכי תת־המשימה חייבים להיות בטווח תאריכי המשימה',
  'Subtask is missing a required type or note': 'חסר סוג או תיאור חובה בתת־המשימה',
  'Subtask not found': 'תת־המשימה לא נמצאה',
  'Subtask timers are disabled in your settings': 'הפעלת טיימרים של תתי־משימות כבויה בהגדרות',
  'Timer is already running': 'הטיימר כבר פועל',
  'Another timer is already running': 'טיימר אחר כבר פועל',
  'Timer is not running': 'הטיימר אינו פועל',
  'A customer with the same phone number or email already exists': 'כבר קיים לקוח עם אותו מספר טלפון או כתובת אימייל',
  'A customer with the same phone number or email may already exist': 'ייתכן שכבר קיים לקוח עם אותו מספר טלפון או כתובת אימייל',
  'Invalid status': 'הסטטוס שנבחר אינו תקין',
  'Not found': 'הרשומה לא נמצאה',
  'Failed to fetch user': 'טעינת פרטי המשתמש נכשלה',
  'Failed to create customer': 'יצירת הלקוח נכשלה',
  'Failed to fetch records': 'טעינת הרשומות נכשלה',
  'Failed to fetch record': 'טעינת הרשומה נכשלה',
  'Failed to create record': 'יצירת הרשומה נכשלה',
  'Failed to update record': 'עדכון הרשומה נכשל',
  'Failed to delete record': 'מחיקת הרשומה נכשלה',
  'Failed to validate task dates': 'בדיקת תאריכי המשימה נכשלה',
  'Failed to change subtask timer status': 'עדכון מצב הטיימר של תת־המשימה נכשל',
  'Internal server error': 'אירעה שגיאה בשרת. נסו שוב מאוחר יותר',
  'Invalid picklist definition': 'הגדרת רשימת בחירה אינה תקינה',
  'System options cannot be removed, but their labels can be changed': 'לא ניתן להסיר אפשרויות מערכת, אך ניתן לשנות את שמותיהן',
}

const fieldLabels = {
  fullName: 'שם מלא',
  title: 'כותרת',
  customerId: 'שיוך ללקוח',
  location: 'מיקום',
  phone: 'טלפון',
  email: 'אימייל',
  notes: 'הערות',
  startTime: 'שעת התחלה',
  endTime: 'שעת סיום',
  dueDate: 'תאריך יעד',
  status: 'סטטוס',
  priority: 'עדיפות',
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    const serverMessage = typeof data === 'string' ? data : data?.error

    if (!serverMessage) {
      if (!error.response) error.message = 'לא ניתן להתחבר לשרת. בדקו את החיבור ונסו שוב'
      return Promise.reject(error)
    }

    let localizedMessage = apiErrorTranslations[serverMessage]
    const requiredField = serverMessage.match(/^(.+) is required$/)
    const invalidField = serverMessage.match(/^Invalid (.+)$/)
    const missingFields = serverMessage.match(/^Required fields: (.+)$/)
    const missingRelation = serverMessage.match(/^(.+) not found$/)
    const cannotRemoveOption = serverMessage.match(/^Cannot remove "(.+)" while existing records still use it$/)

    if (!localizedMessage && requiredField) {
      localizedMessage = `השדה ${fieldLabels[requiredField[1]] || requiredField[1]} הוא שדה חובה`
    } else if (!localizedMessage && invalidField) {
      localizedMessage = `הערך שהוזן עבור ${fieldLabels[invalidField[1]] || invalidField[1]} אינו תקין`
    } else if (!localizedMessage && missingFields) {
      localizedMessage = 'חסרים שדות חובה בטופס'
    } else if (!localizedMessage && missingRelation) {
      localizedMessage = `${missingRelation[1] === 'Customer' ? 'הלקוח' : 'הרשומה'} לא נמצא${missingRelation[1] === 'Customer' ? '' : 'ה'}`
    } else if (!localizedMessage && cannotRemoveOption) {
      localizedMessage = `לא ניתן להסיר את "${cannotRemoveOption[1]}" כל עוד רשומות קיימות משתמשות בו`
    } else if (!localizedMessage && /[a-z]/i.test(serverMessage)) {
      localizedMessage = error.response.status >= 500
        ? 'אירעה שגיאה בשרת. נסו שוב מאוחר יותר'
        : 'לא ניתן להשלים את הפעולה. בדקו את הפרטים ונסו שוב'
    }

    if (localizedMessage) {
      if (typeof data === 'string') error.response.data = { error: localizedMessage }
      else error.response.data.error = localizedMessage
    }

    return Promise.reject(error)
  }
)

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
