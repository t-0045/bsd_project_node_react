import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

// יבואי MUI
import { Add, ChevronLeft, ChevronRight, Clear, Delete, Edit, ExpandLess, ExpandMore, Search } from "@mui/icons-material"
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Fab, IconButton, InputAdornment, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material"
import { createAppointment, deleteAppointment, getAppointments, getCustomers, updateAppointment } from "../../api"

const emptyAppointment = { customerId: '', title: '', startTime: '', endTime: '', location: '', status: 'SCHEDULED' }
const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const pad = (value) => String(value).padStart(2, '0')
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const localDateTime = (date) => `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
const startOfWeek = (date) => { const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - result.getDay()); return result }
const sameDay = (first, second) => dateKey(first) === dateKey(second)
const appointmentDate = (item, field = 'startTime') => { const date = new Date(item[field]); return Number.isNaN(date.getTime()) ? null : date }
const initialFilters = { text: '', customerId: '', status: '', fromDate: '', toDate: '', fromHour: '', toHour: '' }

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([])
  const [customers, setCustomers] = useState([])
  const [appointment, setAppointment] = useState(emptyAppointment)
  const [filters, setFilters] = useState(initialFilters)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [calendarView, setCalendarView] = useState('week')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [dayStartHour, setDayStartHour] = useState(0)
  const [dayEndHour, setDayEndHour] = useState(24)
  const [searchParams, setSearchParams] = useSearchParams()
  const customerIdFromUrl = searchParams.get('customerId') || ''
  const appointmentIdFromUrl = searchParams.get('appointmentId') || ''

  const fetchAppointments = async () => {
    try { setAppointments(await getAppointments()) }
    catch (requestError) { setError(requestError.response?.data?.error || 'Failed to fetch appointments') }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    const loadData = async () => {
      const [, loadedCustomers] = await Promise.all([fetchAppointments(), getCustomers()])
      setCustomers(loadedCustomers)
      const appointmentFromUrl = appointmentIdFromUrl && (await getAppointments()).find((item) => item.id === appointmentIdFromUrl)
      if (appointmentFromUrl) {
        setAppointment({ ...emptyAppointment, ...appointmentFromUrl })
        setEditingId(appointmentFromUrl.id)
        setOpen(true)
        setSearchParams({}, { replace: true })
      } else if (customerIdFromUrl && loadedCustomers.some((item) => item.id === customerIdFromUrl && !item.isDeleted)) {
        setAppointment({ ...emptyAppointment, customerId: customerIdFromUrl })
        setEditingId(null)
        setOpen(true)
        setSearchParams({}, { replace: true })
      }
    }
    loadData()
  }, [appointmentIdFromUrl, customerIdFromUrl, setSearchParams])

  const openAdd = () => { setAppointment({ ...emptyAppointment, customerId: '' }); setEditingId(null); setOpen(true) }
  const openEdit = (item) => { setAppointment({ ...emptyAppointment, ...item }); setEditingId(item.id); setOpen(true) }
  const handleChange = ({ target }) => setAppointment({ ...appointment, [target.name]: target.value })
  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingId) await updateAppointment(editingId, appointment)
      else await createAppointment(appointment)
      setOpen(false)
      fetchAppointments()
    } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to save appointment') }
  }
  const handleDelete = async (id) => { if (window.confirm('Delete this appointment?')) { await deleteAppointment(id); fetchAppointments() } }
  const customerName = (id) => customers.find((item) => item.id === id)?.fullName || id
  const filteredAppointments = appointments.filter((item) => {
    const text = filters.text.trim().toLowerCase()
    const searchableText = `${item.title} ${item.customerId} ${customerName(item.customerId)} ${item.location} ${item.status}`.toLowerCase()
    const start = appointmentDate(item)
    if (text && !searchableText.includes(text)) return false
    if (filters.customerId && item.customerId !== filters.customerId) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.fromDate && (!start || dateKey(start) < filters.fromDate)) return false
    if (filters.toDate && (!start || dateKey(start) > filters.toDate)) return false
    if (filters.fromHour && (!start || start.getHours() < Number(filters.fromHour))) return false
    if (filters.toHour && (!start || start.getHours() >= Number(filters.toHour))) return false
    return true
  })
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }))
  const clearFilters = () => setFilters(initialFilters)

  const openNewAt = (date) => {
    const end = new Date(date.getTime() + 60 * 60 * 1000)
    setAppointment({ ...emptyAppointment, startTime: localDateTime(date), endTime: localDateTime(end) })
    setEditingId(null)
    setOpen(true)
  }

  const moveCalendar = (amount) => {
    const next = new Date(calendarDate)
    if (calendarView === 'month') next.setMonth(next.getMonth() + amount)
    else if (calendarView === 'week') next.setDate(next.getDate() + amount * 7)
    else next.setDate(next.getDate() + amount)
    setCalendarDate(next)
  }

  const calendarDays = calendarView === 'day'
    ? [new Date(calendarDate)]
    : calendarView === 'week'
      ? Array.from({ length: 7 }, (_, index) => { const date = startOfWeek(calendarDate); date.setDate(date.getDate() + index); return date })
      : (() => {
          const first = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1)
          const last = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0)
          const days = Array.from({ length: first.getDay() }, () => null)
          for (let day = 1; day <= last.getDate(); day += 1) days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day))
          while (days.length % 7) days.push(null)
          return days
        })()

  const calendarTitle = calendarView === 'month'
    ? calendarDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    : calendarView === 'week'
      ? `${calendarDays[0].toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${calendarDays[6].toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : calendarDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const visibleForDay = (date) => filteredAppointments.filter((item) => {
    const start = appointmentDate(item)
    if (!start || !sameDay(start, date)) return false
    if (calendarView !== 'day' && calendarView !== 'week') return true
    const end = appointmentDate(item, 'endTime') || new Date(start.getTime() + 60 * 60 * 1000)
    return start.getHours() * 60 + start.getMinutes() < dayEndHour * 60 && end.getHours() * 60 + end.getMinutes() > dayStartHour * 60
  })

  const handleCalendarDrop = async (event, date, minutes) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('appointmentId')
    const item = appointments.find((appointmentItem) => appointmentItem.id === id)
    if (!item) return
    const oldStart = appointmentDate(item)
    const oldEnd = appointmentDate(item, 'endTime')
    if (!oldStart || !oldEnd) return
    const nextStart = new Date(date)
    nextStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    const nextEnd = new Date(nextStart.getTime() + oldEnd.getTime() - oldStart.getTime())
    if (!window.confirm(`להעביר את הפגישה ל-${nextStart.toLocaleString('he-IL')}?`)) return
    try {
      await updateAppointment(item.id, { ...item, startTime: localDateTime(nextStart), endTime: localDateTime(nextEnd) })
      fetchAppointments()
    } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to move appointment') }
  }

  const appointmentBlock = (item) => {
    const start = appointmentDate(item)
    const end = appointmentDate(item, 'endTime') || new Date(start.getTime() + 60 * 60 * 1000)
    const visibleStart = calendarView === 'day' || calendarView === 'week' ? dayStartHour * 60 : 0
    const minutes = start.getHours() * 60 + start.getMinutes() - visibleStart
    const duration = Math.max(30, (end - start) / 60000)
    const unit = calendarView === 'day' ? 0.25 : 1
    return <Paper key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('appointmentId', item.id)} onClick={() => openEdit(item)} sx={{ position: 'absolute', top: minutes * unit, left: 3, right: 3, minHeight: Math.max(30, duration * unit), zIndex: 2, p: 0.75, overflow: 'hidden', cursor: 'grab', bgcolor: item.status === 'CANCELLED' ? 'grey.300' : 'primary.light', color: 'primary.contrastText' }}><Typography variant="caption" fontWeight="bold" noWrap>{item.title}</Typography><Typography variant="caption" display="block" noWrap>{start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</Typography></Paper>
  }

  const renderTimeGrid = () => {
    const isDay = calendarView === 'day'
    const days = isDay ? calendarDays : calendarDays
    const step = isDay ? 15 : 60
    const unit = isDay ? 0.25 : 1
    const firstMinute = calendarView === 'day' || calendarView === 'week' ? dayStartHour * 60 : 0
    const lastMinute = calendarView === 'day' || calendarView === 'week' ? dayEndHour * 60 : 24 * 60
    const slots = Array.from({ length: (lastMinute - firstMinute) / step }, (_, index) => firstMinute + index * step)
    const gridHeight = (lastMinute - firstMinute) * unit
    return <Box sx={{ display: 'grid', gridTemplateColumns: `64px repeat(${days.length}, minmax(${isDay ? 180 : 120}px, 1fr))`, minWidth: isDay ? 244 : 900, overflow: 'auto' }}>
      <Box />
      {days.map((date) => <Box key={dateKey(date)} sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 'bold' }}>{isDay ? dayNames[date.getDay()] : `${dayNames[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`}</Box>)}
      <Box sx={{ position: 'relative' }}>{slots.map((minutes) => <Box key={minutes} sx={{ height: 60 * unit, borderBottom: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: 12, pt: 0.5 }}>{`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`}</Box>)}</Box>
      {days.map((date) => <Box key={dateKey(date)} onDragOver={(event) => event.preventDefault()} sx={{ position: 'relative', height: gridHeight, borderLeft: '1px solid', borderColor: 'divider', background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 59px, rgba(0,0,0,.08) 60px)' }}>
        {slots.map((minutes) => <Box key={minutes} onClick={() => { const slotDate = new Date(date); slotDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0); openNewAt(slotDate) }} onDrop={(event) => handleCalendarDrop(event, date, minutes)} sx={{ height: 60 * unit, borderBottom: isDay ? '1px dashed' : '1px solid', borderColor: 'divider' }} />)}
        {visibleForDay(date).map(appointmentBlock)}
      </Box>)}
    </Box>
  }

  const renderMonth = () => <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(110px, 1fr))', minWidth: 770, borderTop: '1px solid', borderLeft: '1px solid', borderColor: 'divider' }}>
    {dayNames.map((name) => <Box key={name} sx={{ p: 1, textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>{name}</Box>)}
    {calendarDays.map((date, index) => <Box key={date ? dateKey(date) : `empty-${index}`} onClick={() => date && openNewAt(date)} sx={{ minHeight: 130, p: 1, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: date && sameDay(date, new Date()) ? 'action.hover' : 'transparent', cursor: date ? 'pointer' : 'default' }}>{date && <><Typography variant="caption" fontWeight="bold">{date.getDate()}</Typography>{visibleForDay(date).map((item) => <Paper key={item.id} onClick={(event) => { event.stopPropagation(); openEdit(item) }} sx={{ mt: 0.5, px: 0.5, bgcolor: 'primary.light', color: 'primary.contrastText', overflow: 'hidden' }}><Typography variant="caption" noWrap>{item.title}</Typography></Paper>)}</>}</Box>)}
  </Box>

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>
  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">פגישות</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Button startIcon={isAdvancedSearchOpen ? <ExpandLess /> : <ExpandMore />} onClick={() => setIsAdvancedSearchOpen((openState) => !openState)}>{isAdvancedSearchOpen ? 'סגירת חיפוש מתקדם' : 'חיפוש מתקדם'}</Button>
          <Typography variant="h6">חיפוש וסינון פגישות</Typography>
        </Stack>
        <TextField fullWidth label="חיפוש בכל השדות" placeholder="כותרת, לקוח, מיקום..." value={filters.text} onChange={(event) => updateFilter('text', event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
        {isAdvancedSearchOpen && <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>
            <TextField select label="לקוח" value={filters.customerId} onChange={(event) => updateFilter('customerId', event.target.value)}><MenuItem value="">כל הלקוחות</MenuItem>{customers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}</TextField>
            <TextField select label="סטטוס" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><MenuItem value="">כל הסטטוסים</MenuItem><MenuItem value="SCHEDULED">מתוכננת</MenuItem><MenuItem value="COMPLETED">הושלמה</MenuItem><MenuItem value="CANCELLED">בוטלה</MenuItem></TextField>
            <TextField label="מתאריך" type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="עד תאריך" type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField select label="משעה" value={filters.fromHour} onChange={(event) => updateFilter('fromHour', event.target.value)}><MenuItem value="">כל השעות</MenuItem>{Array.from({ length: 24 }, (_, hour) => <MenuItem key={hour} value={hour}>{`${pad(hour)}:00`}</MenuItem>)}</TextField>
            <TextField select label="עד שעה" value={filters.toHour} onChange={(event) => updateFilter('toHour', event.target.value)}><MenuItem value="">כל השעות</MenuItem>{Array.from({ length: 24 }, (_, hour) => <MenuItem key={hour} value={hour}>{`${pad(hour)}:00`}</MenuItem>)}</TextField>
            <Button startIcon={<Clear />} onClick={clearFilters} disabled={!Object.values(filters).some(Boolean)}>ניקוי מסננים</Button>
          </Box>
        </>}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>נמצאו {filteredAppointments.length} פגישות</Typography>
      </Paper>
      <Paper sx={{ p: 2, mb: 3, overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, minWidth: 500 }}>
          <Stack direction="row" alignItems="center"><IconButton onClick={() => moveCalendar(-1)} aria-label="הקודם"><ChevronRight /></IconButton><IconButton onClick={() => moveCalendar(1)} aria-label="הבא"><ChevronLeft /></IconButton><Button onClick={() => setCalendarDate(new Date())}>היום</Button></Stack>
          <Typography fontWeight="bold">{calendarTitle}</Typography>
        </Stack>
        <Tabs value={calendarView} onChange={(_, value) => setCalendarView(value)} sx={{ mb: 2 }}><Tab value="day" label="יום" /><Tab value="week" label="שבוע" /><Tab value="month" label="חודש" /></Tabs>
        {(calendarView === 'day' || calendarView === 'week') && <Stack direction="row" spacing={2} sx={{ mb: 2, maxWidth: 420 }}>
          <TextField select label="משעה" value={dayStartHour} onChange={({ target }) => setDayStartHour(Number(target.value))} size="small" fullWidth>
            {Array.from({ length: 24 }, (_, hour) => <MenuItem key={hour} value={hour}>{`${pad(hour)}:00`}</MenuItem>)}
          </TextField>
          <TextField select label="עד שעה" value={dayEndHour} onChange={({ target }) => setDayEndHour(Number(target.value))} size="small" fullWidth>
            {Array.from({ length: 25 - dayStartHour }, (_, index) => index + dayStartHour + 1).map((hour) => <MenuItem key={hour} value={hour}>{`${pad(hour === 24 ? 0 : hour)}:00${hour === 24 ? ' (למחרת)' : ''}`}</MenuItem>)}
          </TextField>
        </Stack>}
        {calendarView === 'month' ? renderMonth() : renderTimeGrid()}
      </Paper>
      <Stack spacing={2} sx={{ mb: 4 }}>
        {filteredAppointments.map((item) => (
          <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box><Typography fontWeight="bold">{item.title}</Typography><Typography variant="body2" color="text.secondary">מזהה: {item.id} | לקוח: {item.customerId} ({customerName(item.customerId)})</Typography><Typography variant="body2" color="text.secondary">התחלה: {item.startTime} | סיום: {item.endTime}</Typography><Typography variant="body2" color="text.secondary">מיקום: {item.location || 'ללא'} | סטטוס: {{ SCHEDULED: 'מתוכננת', COMPLETED: 'הושלמה', CANCELLED: 'בוטלה' }[item.status] || item.status}</Typography><Typography variant="caption" color="text.secondary">נוצרה: {item.createdAt || 'ללא'} | עודכנה: {item.updatedAt || 'ללא'}</Typography></Box>
            <Box><IconButton color="primary" onClick={() => openEdit(item)}><Edit /></IconButton><IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Box>
          </Paper>
        ))}
      </Stack>
      <Fab color="primary" aria-label="add appointment" onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}><Add /></Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><Box component="form" onSubmit={handleSubmit}><DialogTitle>{editingId ? 'עריכת פגישה' : 'הוספת פגישה'}</DialogTitle><DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
        <TextField select name="customerId" label="לקוח" value={appointment.customerId} onChange={handleChange} required>{customers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}</TextField>
        <TextField name="title" label="כותרת" value={appointment.title} onChange={handleChange} required /><TextField name="startTime" type="datetime-local" label="שעת התחלה" value={appointment.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required /><TextField name="endTime" type="datetime-local" label="שעת סיום" value={appointment.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required /><TextField name="location" label="מיקום" value={appointment.location} onChange={handleChange} /><TextField select name="status" label="סטטוס" value={appointment.status} onChange={handleChange}><MenuItem value="SCHEDULED">מתוכננת</MenuItem><MenuItem value="COMPLETED">הושלמה</MenuItem><MenuItem value="CANCELLED">בוטלה</MenuItem></TextField>
      </DialogContent><DialogActions><Button onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions></Box></Dialog>
    </Box>
  )
}

export default AppointmentsList