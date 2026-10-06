import { useEffect, useState } from "react"

// יבואי MUI
import { Add, AddTask, CalendarMonth, Delete, Edit, Search } from "@mui/icons-material"
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Fab, IconButton, InputAdornment, MenuItem, Paper, Stack,
  TextField, Typography
} from "@mui/material"
import { createAppointment, createCustomer, createTask, deleteCustomer, getCustomers, updateCustomer } from "../../api"

const emptyCustomer = { fullName: '', phone: '', email: '', status: 'LEAD', notes: '' }
const localDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const CustomersList = () => {
  const [customers, setCustomers] = useState([])
  const [val, setVal] = useState("")
  const [customer, setCustomer] = useState(emptyCustomer)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [activityType, setActivityType] = useState(null)
  const [activityCustomer, setActivityCustomer] = useState(null)
  const [activityForm, setActivityForm] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  const fetchCustomers = async () => {
    try {
      setCustomers(await getCustomers())
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadCustomers = async () => fetchCustomers()
    loadCustomers()
  }, [])

  const openAdd = () => {
    setCustomer(emptyCustomer)
    setEditingId(null)
    setOpen(true)
  }

  const openEdit = (selectedCustomer) => {
    setCustomer({ ...emptyCustomer, ...selectedCustomer })
    setEditingId(selectedCustomer.id)
    setOpen(true)
  }

  const handleChange = ({ target }) => setCustomer({ ...customer, [target.name]: target.value })

  const openActivity = (type, selectedCustomer) => {
    setActivityType(type)
    setActivityCustomer(selectedCustomer)
    if (type === 'appointment') {
      const start = new Date()
      start.setHours(start.getHours() + 1)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      setActivityForm({ customerId: selectedCustomer.id, title: '', startTime: localDateTime(start), endTime: localDateTime(end), location: '', status: 'SCHEDULED' })
    } else {
      setActivityForm({ customerId: selectedCustomer.id, title: '', priority: 'MEDIUM', status: 'OPEN', dueDate: '', notes: '' })
    }
  }

  const closeActivity = () => {
    setActivityType(null)
    setActivityCustomer(null)
    setActivityForm({})
  }

  const handleActivitySubmit = async (event) => {
    event.preventDefault()
    try {
      if (activityType === 'appointment') await createAppointment(activityForm)
      else await createTask(activityForm)
      closeActivity()
    } catch (requestError) {
      setError(requestError.response?.data?.error || `Failed to save ${activityType}`)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingId) await updateCustomer(editingId, customer)
      else await createCustomer(customer)
      setOpen(false)
      fetchCustomers()
    } catch (requestError) {
      if (requestError.response?.data?.code === 'DUPLICATE_CUSTOMER_WARNING') {
        setDuplicateWarning({ customer, matches: requestError.response.data.matches || [] })
        return
      }
      setError(requestError.response?.data?.error || 'Failed to save customer')
    }
  }

  const confirmDuplicateCreate = async () => {
    if (!duplicateWarning) return
    try {
      await createCustomer({ ...duplicateWarning.customer, allowDuplicate: true })
      setDuplicateWarning(null)
      setOpen(false)
      fetchCustomers()
    } catch (requestError) {
      setDuplicateWarning(null)
      setError(requestError.response?.data?.error || 'Failed to save customer')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return
    await deleteCustomer(id)
    fetchCustomers()
  }

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">לקוחות</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        fullWidth
        placeholder="חיפוש לקוחות..."
        value={val}
        onChange={(event) => setVal(event.target.value)}
        sx={{ mb: 3, backgroundColor: 'background.paper' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
      />
      <Stack spacing={2} sx={{ mb: 4 }}>
        {customers.filter((item) => item.fullName.toLowerCase().includes(val.toLowerCase())).map((item) => (
          <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography fontWeight="bold">{item.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">מזהה: {item.id}</Typography>
              <Typography variant="body2" color="text.secondary">טלפון: {item.phone || 'ללא'} | אימייל: {item.email || 'ללא'}</Typography>
              <Typography variant="body2" color="text.secondary">סטטוס: {{ LEAD: 'ליד', ACTIVE: 'פעיל', INACTIVE: 'לא פעיל' }[item.status] || item.status} | נמחק: {item.isDeleted ? 'כן' : 'לא'}</Typography>
              <Typography variant="body2" color="text.secondary">הערות: {item.notes || 'ללא'}</Typography>
              <Typography variant="caption" color="text.secondary">נוצר: {item.createdAt || 'ללא'} | עודכן: {item.updatedAt || 'ללא'}</Typography>
            </Box>
            <Box>
              <IconButton color="success" aria-label={`הוספת משימה עבור ${item.fullName}`} onClick={() => openActivity('task', item)}><AddTask /></IconButton>
              <IconButton color="primary" aria-label={`הוספת פגישה עבור ${item.fullName}`} onClick={() => openActivity('appointment', item)}><CalendarMonth /></IconButton>
              <IconButton color="primary" onClick={() => openEdit(item)}><Edit /></IconButton>
              <IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton>
            </Box>
          </Paper>
        ))}
      </Stack>
      <Fab color="primary" aria-label="add customer" onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}><Add /></Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'עריכת לקוח' : 'הוספת לקוח'}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField name="fullName" label="שם מלא" value={customer.fullName} onChange={handleChange} required />
            <TextField name="phone" label="טלפון" value={customer.phone} onChange={handleChange} />
            <TextField name="email" type="email" label="אימייל" value={customer.email} onChange={handleChange} />
            <TextField select name="status" label="סטטוס" value={customer.status} onChange={handleChange}>
              <MenuItem value="LEAD">ליד</MenuItem><MenuItem value="ACTIVE">פעיל</MenuItem><MenuItem value="INACTIVE">לא פעיל</MenuItem>
            </TextField>
            <TextField name="notes" label="הערות" multiline rows={3} value={customer.notes} onChange={handleChange} />
          </DialogContent>
          <DialogActions><Button onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions>
        </Box>
      </Dialog>
      <Dialog open={Boolean(duplicateWarning)} onClose={() => setDuplicateWarning(null)} fullWidth maxWidth="xs">
        <DialogTitle>ייתכן שהלקוח כבר קיים</DialogTitle>
        <DialogContent>
          <Typography>נמצאו לקוחות עם מספר טלפון או אימייל זהים:</Typography>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {duplicateWarning?.matches.map((match) => (
              <Box key={match.id}>
                <Typography fontWeight="bold">{match.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">{[match.phone, match.email].filter(Boolean).join(' | ')}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateWarning(null)}>חזרה לעריכה</Button>
          <Button variant="contained" onClick={confirmDuplicateCreate}>יצירה בכל זאת</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(activityType)} onClose={closeActivity} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleActivitySubmit}>
          <DialogTitle>{activityType === 'appointment' ? 'הוספת פגישה' : 'הוספת משימה'} עבור {activityCustomer?.fullName}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField name="title" label="כותרת" value={activityForm.title || ''} onChange={({ target }) => setActivityForm({ ...activityForm, title: target.value })} required />
            {activityType === 'appointment' ? <>
              <TextField name="startTime" type="datetime-local" label="שעת התחלה" value={activityForm.startTime || ''} onChange={({ target }) => setActivityForm({ ...activityForm, startTime: target.value })} InputLabelProps={{ shrink: true }} required />
              <TextField name="endTime" type="datetime-local" label="שעת סיום" value={activityForm.endTime || ''} onChange={({ target }) => setActivityForm({ ...activityForm, endTime: target.value })} InputLabelProps={{ shrink: true }} required />
              <TextField name="location" label="מיקום" value={activityForm.location || ''} onChange={({ target }) => setActivityForm({ ...activityForm, location: target.value })} />
              <TextField select name="status" label="סטטוס" value={activityForm.status || 'SCHEDULED'} onChange={({ target }) => setActivityForm({ ...activityForm, status: target.value })}>
                <MenuItem value="SCHEDULED">מתוכננת</MenuItem><MenuItem value="COMPLETED">הושלמה</MenuItem><MenuItem value="CANCELLED">בוטלה</MenuItem>
              </TextField>
            </> : <>
              <TextField select name="priority" label="עדיפות" value={activityForm.priority || 'MEDIUM'} onChange={({ target }) => setActivityForm({ ...activityForm, priority: target.value })}>
                <MenuItem value="LOW">נמוכה</MenuItem><MenuItem value="MEDIUM">בינונית</MenuItem><MenuItem value="HIGH">גבוהה</MenuItem><MenuItem value="URGENT">דחופה</MenuItem>
              </TextField>
              <TextField select name="status" label="סטטוס" value={activityForm.status || 'OPEN'} onChange={({ target }) => setActivityForm({ ...activityForm, status: target.value })}>
                <MenuItem value="OPEN">פתוחה</MenuItem><MenuItem value="IN_PROGRESS">בתהליך</MenuItem><MenuItem value="COMPLETED">הושלמה</MenuItem>
              </TextField>
              <TextField name="dueDate" type="datetime-local" label="תאריך יעד" value={activityForm.dueDate || ''} onChange={({ target }) => setActivityForm({ ...activityForm, dueDate: target.value })} InputLabelProps={{ shrink: true }} required />
              <TextField name="notes" label="הערות" value={activityForm.notes || ''} onChange={({ target }) => setActivityForm({ ...activityForm, notes: target.value })} multiline rows={3} />
            </>}
          </DialogContent>
          <DialogActions><Button onClick={closeActivity}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default CustomersList