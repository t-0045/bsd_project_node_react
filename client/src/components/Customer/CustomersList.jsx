import { useEffect, useState } from "react"

import { Add, AddTask, CalendarMonth, Clear, Delete, Edit, Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Stack, TextField, Typography } from "../Shared/PrimeUI"
import { createAppointment, createCustomer, createTask, deleteCustomer, getCustomers, updateCustomer } from "../../api"
import { formatDateTime } from '../../dateFormat'

const initialFilters = { text: '', fullName: '', phone: '', email: '', notes: '', status: '' }
const emptyCustomer = { fullName: '', phone: '', email: '', status: 'LEAD', notes: '' }
const localDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const CustomersList = ({ user, picklists }) => {
  const customerStatuses = picklists?.customerStatus || []
  const customerRequired = user?.requiredFields?.customer ?? ['fullName']
  const taskRequired = user?.requiredFields?.task ?? ['title']
  const appointmentRequired = user?.requiredFields?.appointment ?? ['customerId', 'title']
  const [customers, setCustomers] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [customer, setCustomer] = useState(emptyCustomer)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [activityType, setActivityType] = useState(null)
  const [activityCustomer, setActivityCustomer] = useState(null)
  const [activityForm, setActivityForm] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  const filteredCustomers = customers.filter((item) => {
    const text = filters.text.trim().toLowerCase()
    const searchableText = `${item.fullName || ''} ${item.phone || ''} ${item.email || ''} ${item.notes || ''} ${customerStatuses.find((option) => option.value === item.status)?.label || item.status || ''}`.toLowerCase()

    if (text && !searchableText.includes(text)) return false
    if (filters.fullName && !(item.fullName || '').toLowerCase().includes(filters.fullName.trim().toLowerCase())) return false
    if (filters.phone && !(item.phone || '').toLowerCase().includes(filters.phone.trim().toLowerCase())) return false
    if (filters.email && !(item.email || '').toLowerCase().includes(filters.email.trim().toLowerCase())) return false
    if (filters.notes && !(item.notes || '').toLowerCase().includes(filters.notes.trim().toLowerCase())) return false
    if (filters.status && item.status !== filters.status) return false

    return true
  })

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }))
  const clearFilters = () => setFilters(initialFilters)

  const fetchCustomers = async () => {
    try {
      setCustomers(await getCustomers())
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'טעינת הלקוחות נכשלה')
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
      setError(requestError.response?.data?.error || (activityType === 'appointment' ? 'שמירת הפגישה נכשלה' : 'שמירת המשימה נכשלה'))
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
      setError(requestError.response?.data?.error || 'שמירת הלקוח נכשלה')
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
      setError(requestError.response?.data?.error || 'שמירת הלקוח נכשלה')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את הלקוח?')) return
    try {
      await deleteCustomer(id)
      setOpen(false)
      setEditingId(null)
      fetchCustomers()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'מחיקת הלקוח נכשלה')
    }
  }

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>

  return (
    <Box className="customers-page" sx={{ position: 'relative' }}>
      <Box className="customers-heading">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">לקוחות</Typography>
          <Typography className="customers-subtitle" variant="body2" color="text.secondary">ניהול פרטי קשר, מעקב ופעילות</Typography>
        </Box>
        <Button className="customers-add-button" variant="contained" startIcon={<Add />} onClick={openAdd}>לקוח חדש</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box className="customers-search-panel">
      <Box className="customers-search-sticky">
      <Box className="customers-search-row" sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, width: '100%' }}>
        <TextField
          fullWidth
          label="חיפוש בכל השדות"
          placeholder="שם, טלפון, אימייל, הערות..."
          value={filters.text}
          onChange={(event) => updateFilter('text', event.target.value)}
          sx={{ backgroundColor: 'background.paper', flex: '1 1 auto', width: 'auto', minWidth: 0 }}
        />
        <Button
          className="advanced-search-button"
          variant="outlined"
          onClick={() => setIsAdvancedSearchOpen((openState) => !openState)}
        >
          {isAdvancedSearchOpen ? 'סגירת חיפוש מתקדם' : 'חיפוש מתקדם'}
        </Button>
        <Typography className="customer-count" variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}>{filteredCustomers.length} לקוחות</Typography>
      </Box>

      {isAdvancedSearchOpen && (
        <Box className="advanced-search-panel">
          <Box className="advanced-search-grid">
            <TextField label="שם מלא" value={filters.fullName} onChange={(event) => updateFilter('fullName', event.target.value)} />
            <TextField label="טלפון" value={filters.phone} onChange={(event) => updateFilter('phone', event.target.value)} />
            <TextField label="אימייל" value={filters.email} onChange={(event) => updateFilter('email', event.target.value)} />
            <TextField label="הערות" value={filters.notes} onChange={(event) => updateFilter('notes', event.target.value)} />
            <TextField select label="סטטוס" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <MenuItem value="">כל הסטטוסים</MenuItem>
              {customerStatuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
          </Box>
          <Box className="advanced-search-actions">
            <Button startIcon={<Clear />} onClick={clearFilters} variant="text" disabled={!Object.values(filters).some(Boolean)}>
              ניקוי מסננים
            </Button>
          </Box>
        </Box>
      )}
      </Box>
      </Box>

      <Box className="customers-content-panel customers-scroll-area">
      <Box className="customers-search-heading">
        <Typography variant="h6">רשימת לקוחות</Typography>
      </Box>
      <Stack className="customers-list" spacing={0} sx={{ mb: 4 }}>
        {filteredCustomers.map((item) => (
          <Paper key={item.id} className="customer-row" elevation={0}>
            <Box className="customer-main">
              <span className="customer-initial" aria-hidden="true">{(item.fullName || '?').trim().charAt(0)}</span>
              <Box className="customer-identity">
                <Typography className="customer-name" fontWeight="bold">{item.fullName || 'לקוח ללא שם'}</Typography>
                <Typography className="customer-contact" variant="body2" color="text.secondary">
                  {[item.phone, item.email].filter(Boolean).join(' · ') || 'אין פרטי קשר'}
                </Typography>
              </Box>
            </Box>
            <Box className="customer-meta">
              <span className={`customer-status status-${(item.status || 'unknown').toLowerCase()}`}>{customerStatuses.find((option) => option.value === item.status)?.label || item.status || 'ללא סטטוס'}</span>
              <Typography className="customer-updated" variant="caption" color="text.secondary">עודכן {formatDateTime(item.updatedAt || item.createdAt)}</Typography>
            </Box>
            <Box className="customer-actions">
              <IconButton color="success" aria-label={`הוספת משימה עבור ${item.fullName}`} onClick={() => openActivity('task', item)}><AddTask /></IconButton>
              <IconButton color="primary" aria-label={`הוספת פגישה עבור ${item.fullName}`} onClick={() => openActivity('appointment', item)}><CalendarMonth /></IconButton>
              <IconButton color="primary" aria-label={`עריכת ${item.fullName}`} onClick={() => openEdit(item)}><Edit /></IconButton>
              <IconButton color="error" aria-label={`מחיקת ${item.fullName}`} onClick={() => handleDelete(item.id)}><Delete /></IconButton>
            </Box>
          </Paper>
        ))}
      </Stack>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'עריכת לקוח' : 'הוספת לקוח'}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField name="fullName" label="שם מלא" value={customer.fullName} onChange={handleChange} required={customerRequired.includes('fullName')} />
            <TextField name="phone" label="טלפון" value={customer.phone} onChange={handleChange} required={customerRequired.includes('phone')} />
            <TextField name="email" type="email" label="אימייל" value={customer.email} onChange={handleChange} required={customerRequired.includes('email')} />
            <TextField select name="status" label="סטטוס" value={customer.status} onChange={handleChange}>
              {customerStatuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField name="notes" label="הערות" multiline rows={3} value={customer.notes} onChange={handleChange} required={customerRequired.includes('notes')} />
          </DialogContent>
          <DialogActions>{editingId && <Button color="error" startIcon={<Delete />} onClick={() => handleDelete(editingId)}>מחיקה</Button>}<Button onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions>
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
            <TextField name="title" label="כותרת" value={activityForm.title || ''} onChange={({ target }) => setActivityForm({ ...activityForm, title: target.value })} required={activityType === 'appointment' ? appointmentRequired.includes('title') : taskRequired.includes('title')} />
            {activityType === 'appointment' ? <>
              <TextField name="startTime" type="datetime-local" label="שעת התחלה" value={activityForm.startTime || ''} onChange={({ target }) => setActivityForm({ ...activityForm, startTime: target.value })} InputLabelProps={{ shrink: true }} required />
              <TextField name="endTime" type="datetime-local" label="שעת סיום" value={activityForm.endTime || ''} onChange={({ target }) => setActivityForm({ ...activityForm, endTime: target.value })} InputLabelProps={{ shrink: true }} required />
              <TextField name="location" label="מיקום" value={activityForm.location || ''} onChange={({ target }) => setActivityForm({ ...activityForm, location: target.value })} required={appointmentRequired.includes('location')} />
              <TextField select name="status" label="סטטוס" value={activityForm.status || 'SCHEDULED'} onChange={({ target }) => setActivityForm({ ...activityForm, status: target.value })}>
                {(picklists?.appointmentStatus || []).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </> : <>
              <TextField select name="priority" label="עדיפות" value={activityForm.priority || 'MEDIUM'} onChange={({ target }) => setActivityForm({ ...activityForm, priority: target.value })}>
                {(picklists?.taskPriority || []).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField select name="status" label="סטטוס" value={activityForm.status || 'OPEN'} onChange={({ target }) => setActivityForm({ ...activityForm, status: target.value })}>
                {(picklists?.taskStatus || []).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField name="dueDate" type="datetime-local" label="תאריך יעד" value={activityForm.dueDate || ''} onChange={({ target }) => setActivityForm({ ...activityForm, dueDate: target.value })} InputLabelProps={{ shrink: true }} required />
              <TextField name="notes" label="הערות" value={activityForm.notes || ''} onChange={({ target }) => setActivityForm({ ...activityForm, notes: target.value })} multiline rows={3} required={taskRequired.includes('notes')} />
            </>}
          </DialogContent>
          <DialogActions><Button onClick={closeActivity}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default CustomersList