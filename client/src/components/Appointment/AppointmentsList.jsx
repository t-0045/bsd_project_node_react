import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { HebrewCalendar } from '@hebcal/core'

import { Add, ChevronLeft, ChevronRight, Clear, Delete, Edit, Search, Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from "../Shared/PrimeUI"
import { createAppointment, deleteAppointment, getAppointments, getCustomers, updateAppointment, updateSystemSettings } from "../../api"
import { formatDateTime } from '../../dateFormat'
import QuickCreateCustomer, { QuickCreateCustomerOption } from '../Customer/QuickCreateCustomer'

const emptyAppointment = { customerId: '', title: '', startTime: '', endTime: '', location: '', status: 'SCHEDULED' }
const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const hebrewCalendarFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
const hebrewMonthFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long', year: 'numeric' })
const hebrewMonthDayFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long' })
const hebrewNumber = (value) => {
  if (value === 15) return 'ט״ו'
  if (value === 16) return 'ט״ז'
  let remainder = value
  let result = ''
  for (const [number, letter] of [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']]) {
    while (remainder >= number) {
      result += letter
      remainder -= number
    }
  }
  return result.length === 1 ? `${result}׳` : `${result.slice(0, -1)}״${result.slice(-1)}`
}
const formatHebrewDay = (date) => {
  const parts = hebrewMonthDayFormatter.formatToParts(date)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  const month = parts.find((part) => part.type === 'month')?.value
  return `${hebrewNumber(day)} ב${month}`
}
const formatHebrewYear = (date) => {
  const year = Number(hebrewCalendarFormatter.formatToParts(date).find((part) => part.type === 'year')?.value)
  return hebrewNumber(year % 1000)
}
const formatHebrewDate = (date) => `${formatHebrewDay(date)} ${formatHebrewYear(date)}`
const holidaysForDate = (date) => HebrewCalendar.calendar({ start: date, end: date, il: true, locale: 'he-x-NoNikud' })
  .filter((event) => {
    const name = event.render('he-x-NoNikud')
    return event.hasFlag('CHAG') || event.hasFlag('ROSH_CHODESH') || /^(חנוכה:|פורים$|שושן פורים$)/.test(name)
  })
  .map((event) => event.render('he-x-NoNikud'))
const pad = (value) => String(value).padStart(2, '0')
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const localDateTime = (date) => `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
const startOfWeek = (date) => { const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - result.getDay()); return result }
const sameDay = (first, second) => dateKey(first) === dateKey(second)
const hebrewMonthKey = (date) => hebrewMonthFormatter.format(date)
const startOfHebrewMonth = (date) => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  const month = hebrewMonthKey(result)
  while (true) {
    const previous = new Date(result)
    previous.setDate(previous.getDate() - 1)
    if (hebrewMonthKey(previous) !== month) return result
    result.setDate(result.getDate() - 1)
  }
}
const appointmentDate = (item, field = 'startTime') => { const date = new Date(item[field]); return Number.isNaN(date.getTime()) ? null : date }
const initialFilters = { text: '', customerId: '', status: '', fromDate: '', toDate: '', fromHour: '', toHour: '' }

const AppointmentsList = ({ picklists, user, onUserUpdate }) => {
  const appointmentStatuses = picklists?.appointmentStatus || []
  const appointmentRequired = user?.requiredFields?.appointment ?? ['customerId', 'title']
  const appointmentTitleRequired = user?.requiredFields?.appointment?.includes('title') ?? true
  const [appointments, setAppointments] = useState([])
  const [customers, setCustomers] = useState([])
  const [appointment, setAppointment] = useState(emptyAppointment)
  const [filters, setFilters] = useState(initialFilters)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [detailsAppointment, setDetailsAppointment] = useState(null)
  const [quickCreateCustomerOpen, setQuickCreateCustomerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [calendarView, setCalendarView] = useState(['day', 'week', 'month'].includes(user?.calendarView) ? user.calendarView : 'week')
  const [calendarType, setCalendarType] = useState(user?.calendarType === 'hebrew' ? 'hebrew' : 'gregorian')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [dayStartHour, setDayStartHour] = useState(user?.calendarStartHour ?? 7)
  const [dayEndHour, setDayEndHour] = useState(user?.calendarEndHour ?? 17)
  const [searchParams, setSearchParams] = useSearchParams()
  const customerIdFromUrl = searchParams.get('customerId') || ''
  const appointmentIdFromUrl = searchParams.get('appointmentId') || ''

  const fetchAppointments = async () => {
    try { setAppointments(await getAppointments()) }
    catch (requestError) { setError(requestError.response?.data?.error || 'טעינת הפגישות נכשלה') }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    const loadData = async () => {
      const [, loadedCustomers] = await Promise.all([fetchAppointments(), getCustomers()])
      setCustomers(loadedCustomers)
      const appointmentFromUrl = appointmentIdFromUrl && (await getAppointments()).find((item) => item.id === appointmentIdFromUrl)
      if (appointmentFromUrl) {
        setDetailsAppointment(appointmentFromUrl)
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
  const handleChange = ({ target }) => {
    if (target.value === '__create_customer__') {
      setQuickCreateCustomerOpen(true)
      return
    }
    setAppointment({ ...appointment, [target.name]: target.value })
  }
  const handleCustomerCreated = (createdCustomer) => {
    setCustomers((current) => [...current, createdCustomer])
    setAppointment((current) => ({ ...current, customerId: createdCustomer.id }))
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingId) await updateAppointment(editingId, appointment)
      else await createAppointment(appointment)
      setOpen(false)
      fetchAppointments()
    } catch (requestError) { setError(requestError.response?.data?.error || 'שמירת הפגישה נכשלה') }
  }
  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את הפגישה?')) return
    try {
      await deleteAppointment(id)
      setOpen(false)
      setDetailsAppointment(null)
      setEditingId(null)
      fetchAppointments()
    } catch (requestError) { setError(requestError.response?.data?.error || 'מחיקת הפגישה נכשלה') }
  }
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

  const saveCalendarHours = async (startHour, endHour) => {
    setDayStartHour(startHour)
    setDayEndHour(endHour)
    try {
      const updatedUser = await updateSystemSettings({ calendarStartHour: startHour, calendarEndHour: endHour })
      onUserUpdate?.(updatedUser)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'שמירת שעות הלוח נכשלה')
    }
  }

  const saveCalendarType = async (type) => {
    setCalendarType(type)
    try {
      const updatedUser = await updateSystemSettings({ calendarType: type })
      onUserUpdate?.(updatedUser)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'שמירת סוג הלוח נכשלה')
    }
  }

  const saveCalendarView = async (view) => {
    setCalendarView(view)
    try {
      const updatedUser = await updateSystemSettings({ calendarView: view })
      onUserUpdate?.(updatedUser)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'שמירת תצוגת הלוח נכשלה')
    }
  }

  const openNewAt = (date) => {
    const end = new Date(date.getTime() + 60 * 60 * 1000)
    setAppointment({ ...emptyAppointment, startTime: localDateTime(date), endTime: localDateTime(end) })
    setEditingId(null)
    setOpen(true)
  }

  const moveCalendar = (amount) => {
    const next = new Date(calendarDate)
    if (calendarView === 'month' && calendarType === 'hebrew') {
      const monthStart = startOfHebrewMonth(calendarDate)
      next.setTime(monthStart.getTime())
      next.setDate(next.getDate() + amount * 32)
      setCalendarDate(startOfHebrewMonth(next))
      return
    }
    if (calendarView === 'month') next.setMonth(next.getMonth() + amount)
    else if (calendarView === 'week') next.setDate(next.getDate() + amount * 7)
    else next.setDate(next.getDate() + amount)
    setCalendarDate(next)
  }

  const calendarDays = calendarView === 'day'
    ? [new Date(calendarDate)]
    : calendarView === 'week'
      ? Array.from({ length: 7 }, (_, index) => { const date = startOfWeek(calendarDate); date.setDate(date.getDate() + index); return date })
      : calendarType === 'hebrew'
        ? (() => {
            const first = startOfHebrewMonth(calendarDate)
            const month = hebrewMonthKey(first)
            const days = Array.from({ length: first.getDay() }, () => null)
            for (let date = new Date(first); hebrewMonthKey(date) === month; date.setDate(date.getDate() + 1)) days.push(new Date(date))
            while (days.length % 7) days.push(null)
            return days
          })()
      : (() => {
          const first = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1)
          const last = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0)
          const days = Array.from({ length: first.getDay() }, () => null)
          for (let day = 1; day <= last.getDate(); day += 1) days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day))
          while (days.length % 7) days.push(null)
          return days
        })()

  const formatCalendarDate = (date, options) => calendarType === 'hebrew'
    ? formatHebrewDate(date)
    : date.toLocaleDateString('he-IL', options)
  const calendarTitle = calendarView === 'month'
    ? calendarType === 'hebrew'
      ? `${hebrewMonthDayFormatter.formatToParts(calendarDate).find((part) => part.type === 'month')?.value} ${formatHebrewYear(calendarDate)}`
      : calendarDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    : calendarView === 'week'
      ? `${formatCalendarDate(calendarDays[0], { day: 'numeric', month: 'short' })} - ${formatCalendarDate(calendarDays[6], { day: 'numeric', month: 'short', year: 'numeric' })}`
      : calendarType === 'hebrew'
        ? `${dayNames[calendarDate.getDay()]} ${formatCalendarDate(calendarDate)}`
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
    } catch (requestError) { setError(requestError.response?.data?.error || 'העברת הפגישה נכשלה') }
  }

  const appointmentBlock = (item) => {
    const start = appointmentDate(item)
    const end = appointmentDate(item, 'endTime') || new Date(start.getTime() + 60 * 60 * 1000)
    const visibleStart = calendarView === 'day' || calendarView === 'week' ? dayStartHour * 60 : 0
    const minutes = start.getHours() * 60 + start.getMinutes() - visibleStart
    const duration = Math.max(30, (end - start) / 60000)
    const unit = calendarView === 'day' ? 0.25 : 1
    return <Paper key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('appointmentId', item.id)} onClick={() => setDetailsAppointment(item)} sx={{ position: 'absolute', top: minutes * unit, left: 3, right: 3, minHeight: Math.max(30, duration * unit), zIndex: 2, p: 0.75, overflow: 'hidden', cursor: 'pointer', bgcolor: item.status === 'CANCELLED' ? 'grey.300' : 'primary.light', color: 'primary.contrastText' }}><Typography variant="caption" fontWeight="bold" noWrap>{item.title}</Typography><Typography variant="caption" display="block" noWrap>{start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</Typography></Paper>
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
    return <Box className="calendar-time-grid" sx={{ display: 'grid', gridTemplateColumns: `64px repeat(${days.length}, minmax(${isDay ? 180 : 120}px, 1fr))`, minWidth: isDay ? 244 : 900 }}>
      <Box />
      {days.map((date) => <Box key={dateKey(date)} className={`calendar-day-header${sameDay(date, new Date()) ? ' calendar-current-day' : ''}`} style={{ border: '1px solid #cbd5da', borderBottom: 0, backgroundColor: '#ffffff' }} sx={{ boxSizing: 'border-box', p: 1, textAlign: 'center', fontWeight: 'bold' }}>{isDay ? dayNames[date.getDay()] : `${dayNames[date.getDay()]} ${calendarType === 'hebrew' ? formatHebrewDay(date) : `${date.getDate()}/${date.getMonth() + 1}`}`}</Box>)}
      <Box className="calendar-hour-labels" sx={{ position: 'relative' }}>{slots.map((minutes) => <Box key={minutes} style={{ borderBottom: '1px solid #e1e7ea' }} sx={{ height: 60 * unit, color: 'text.secondary', fontSize: 12, pt: 0.5 }}>{`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`}</Box>)}</Box>
      {days.map((date) => <Box key={dateKey(date)} className={`calendar-day-column${sameDay(date, new Date()) ? ' calendar-current-day' : ''}`} onDragOver={(event) => event.preventDefault()} style={{ border: '1px solid #cbd5da', borderTop: 0, backgroundColor: sameDay(date, new Date()) ? '#f2f8f7' : '#ffffff' }} sx={{ boxSizing: 'border-box', position: 'relative', height: gridHeight }}>
        {slots.map((minutes) => <Box key={minutes} onClick={() => { const slotDate = new Date(date); slotDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0); openNewAt(slotDate) }} onDrop={(event) => handleCalendarDrop(event, date, minutes)} style={{ borderBottom: '1px solid #e1e7ea' }} sx={{ height: 60 * unit }} />)}
        {visibleForDay(date).map(appointmentBlock)}
      </Box>)}
    </Box>
  }

  const renderMonth = () => <Box className="calendar-month-grid" style={{ borderTop: '1px solid #dce4e8', borderInlineStart: '1px solid #dce4e8' }} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', minWidth: 770 }}>
    {dayNames.map((name) => <Box key={name} className="calendar-weekday-header" style={{ borderInlineEnd: '1px solid #dce4e8', borderBottom: '1px solid #dce4e8' }} sx={{ boxSizing: 'border-box', minHeight: 42, p: 1, textAlign: 'center', fontWeight: 'bold', color: 'text.primary' }}>{name}</Box>)}
    {calendarDays.map((date, index) => {
      const isToday = date && sameDay(date, new Date())
      return <Box key={date ? dateKey(date) : `empty-${index}`} className={isToday ? 'calendar-month-today' : date ? 'calendar-month-day' : 'calendar-month-empty'} onClick={() => date && openNewAt(date)} style={{ borderInlineEnd: '1px solid #dce4e8', borderBottom: '1px solid #dce4e8', backgroundColor: isToday ? '#e7f4f1' : date ? '#ffffff' : '#f4f7f8' }} sx={{ boxSizing: 'border-box', minHeight: 140, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0.5, cursor: date ? 'pointer' : 'default' }}>
        {date && <>
          <Typography className="calendar-date-number" variant="subtitle2" fontWeight="bold" sx={{ textAlign: 'right', flex: '0 0 auto' }}>{calendarType === 'hebrew' ? formatHebrewDay(date) : date.getDate()}</Typography>
          {calendarType === 'hebrew' && holidaysForDate(date).map((holiday) => <Typography key={holiday} variant="caption" fontWeight="bold" color="primary.main" noWrap>{holiday}</Typography>)}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {visibleForDay(date).map((item) => <Paper key={item.id} className="calendar-event" onClick={(event) => { event.stopPropagation(); setDetailsAppointment(item) }} sx={{ px: 0.75, py: 0.25, bgcolor: item.status === 'CANCELLED' ? 'grey.300' : 'primary.light', color: 'primary.contrastText', overflow: 'hidden' }}><Typography variant="caption" noWrap>{item.title}</Typography></Paper>)}
          </Box>
        </>}
      </Box>
    })}
  </Box>

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>
  return (
    <Box sx={{ position: 'relative' }}>
      <Box className="list-page-heading">
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">פגישות</Typography>
        <Button className="list-page-add-button" variant="contained" startIcon={<Add />} onClick={openAdd}>פגישה חדשה</Button>
      </Box>
      <Box className="appointments-content-panel">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>חיפוש וסינון פגישות</Typography>
        <Stack className="list-search-controls" direction="row" spacing={2} sx={{ width: '100%', direction: 'rtl' }}>
          <TextField
            fullWidth
            label="חיפוש בכל השדות"
            placeholder="כותרת, לקוח, מיקום..."
            value={filters.text}
            onChange={(event) => updateFilter('text', event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
            sx={{ width: '100%' }}
          />
          <Button className="advanced-search-button" variant="outlined" onClick={() => setIsAdvancedSearchOpen((openState) => !openState)}>{isAdvancedSearchOpen ? 'סגירת חיפוש מתקדם' : 'חיפוש מתקדם'}</Button>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}>{filteredAppointments.length} פגישות</Typography>
        </Stack>
        {isAdvancedSearchOpen && <>
          <Box className="advanced-search-panel"><Box className="advanced-search-grid">
            <TextField select label="לקוח" value={filters.customerId} onChange={(event) => updateFilter('customerId', event.target.value)}><MenuItem value="">כל הלקוחות</MenuItem>{customers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}</TextField>
            <TextField select label="סטטוס" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><MenuItem value="">כל הסטטוסים</MenuItem>{appointmentStatuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
            <TextField label="מתאריך" type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="עד תאריך" type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField select label="משעה" value={filters.fromHour} onChange={(event) => updateFilter('fromHour', event.target.value)}><MenuItem value="">כל השעות</MenuItem>{Array.from({ length: 24 }, (_, hour) => <MenuItem key={hour} value={hour}>{`${pad(hour)}:00`}</MenuItem>)}</TextField>
            <TextField select label="עד שעה" value={filters.toHour} onChange={(event) => updateFilter('toHour', event.target.value)}><MenuItem value="">כל השעות</MenuItem>{Array.from({ length: 24 }, (_, hour) => <MenuItem key={hour} value={hour}>{`${pad(hour)}:00`}</MenuItem>)}</TextField>
          </Box>
          <Box className="advanced-search-actions"><Button startIcon={<Clear />} onClick={clearFilters} disabled={!Object.values(filters).some(Boolean)}>ניקוי מסננים</Button></Box>
          </Box>
        </>}
      </Paper>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, minWidth: 500 }}>
          <Stack direction="row" alignItems="center"><IconButton onClick={() => moveCalendar(-1)} aria-label="הקודם"><ChevronLeft /></IconButton><IconButton onClick={() => moveCalendar(1)} aria-label="הבא"><ChevronRight /></IconButton><Button onClick={() => setCalendarDate(new Date())}>היום</Button></Stack>
          <Typography className="calendar-title" fontWeight="bold">{calendarTitle}</Typography>
        </Stack>
        <Tabs value={calendarView} onChange={(_, value) => saveCalendarView(value)} sx={{ mb: 2 }}><Tab value="day" label="יום" /><Tab value="week" label="שבוע" /><Tab value="month" label="חודש" /></Tabs>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button size="small" variant={calendarType === 'gregorian' ? 'contained' : 'outlined'} onClick={() => saveCalendarType('gregorian')}>לועזי</Button>
          <Button size="small" variant={calendarType === 'hebrew' ? 'contained' : 'outlined'} onClick={() => saveCalendarType('hebrew')}>עברי</Button>
        </Stack>
        {(calendarView === 'day' || calendarView === 'week') && <Stack direction="row" spacing={2} sx={{ mb: 2, maxWidth: 420 }}>
          <TextField className="calendar-hour-select" select label="משעה" value={dayStartHour} onChange={({ target }) => {
            const startHour = Number(target.value)
            void saveCalendarHours(startHour, startHour >= dayEndHour ? Math.min(startHour + 1, 24) : dayEndHour)
          }} size="small" fullWidth>
            {Array.from({ length: 24 }, (_, hour) => <MenuItem key={hour} value={hour}>{`${pad(hour)}:00`}</MenuItem>)}
          </TextField>
          <TextField className="calendar-hour-select" select label="עד שעה" value={dayEndHour} onChange={({ target }) => {
            const endHour = Number(target.value)
            void saveCalendarHours(endHour <= dayStartHour ? Math.max(endHour - 1, 0) : dayStartHour, endHour)
          }} size="small" fullWidth>
            {Array.from({ length: 25 - dayStartHour }, (_, index) => index + dayStartHour + 1).map((hour) => <MenuItem key={hour} value={hour}>{`${pad(hour === 24 ? 0 : hour)}:00${hour === 24 ? ' (למחרת)' : ''}`}</MenuItem>)}
          </TextField>
        </Stack>}
        {calendarView === 'month' ? renderMonth() : renderTimeGrid()}
      </Paper>
      <Stack spacing={2} sx={{ mb: 4 }}>
        {filteredAppointments.map((item) => (
          <Paper key={item.id} elevation={1} tabIndex={0} aria-label={`פתיחת פרטי הפגישה ${item.title || 'ללא כותרת'}`} onClick={(event) => {
            if (event.target.closest('button')) return
            setDetailsAppointment(item)
          }} onKeyDown={(event) => {
            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              setDetailsAppointment(item)
            }
          }} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <Box><Typography fontWeight="bold">{item.title || 'ללא כותרת'}</Typography><Typography variant="body2" color="text.secondary">לקוח: {item.customerId ? customerName(item.customerId) : 'ללא לקוח'}</Typography><Typography variant="body2" color="text.secondary">התחלה: {formatDateTime(item.startTime)} | סיום: {formatDateTime(item.endTime)}</Typography><Typography variant="body2" color="text.secondary">מיקום: {item.location || 'ללא'} | סטטוס: {appointmentStatuses.find((option) => option.value === item.status)?.label || item.status}</Typography><Typography variant="caption" color="text.secondary">נוצרה: {formatDateTime(item.createdAt)} | עודכנה: {formatDateTime(item.updatedAt)}</Typography></Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}><IconButton color="error" aria-label="מחיקת פגישה" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Box>
          </Paper>
        ))}
      </Stack>
      <Dialog className="record-details-dialog" open={Boolean(detailsAppointment)} onClose={() => setDetailsAppointment(null)} fullWidth maxWidth="sm">
        {detailsAppointment && <>
          <DialogTitle>{detailsAppointment.title || 'ללא כותרת'}</DialogTitle>
          <DialogContent className="record-details-content">
            <Box className="record-details-grid">
              <Box className="record-detail-field"><Typography variant="caption">לקוח</Typography><Typography>{detailsAppointment.customerId ? customerName(detailsAppointment.customerId) : 'ללא לקוח'}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">סטטוס</Typography><Typography>{appointmentStatuses.find((option) => option.value === detailsAppointment.status)?.label || detailsAppointment.status}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">התחלה</Typography><Typography>{formatDateTime(detailsAppointment.startTime)}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">סיום</Typography><Typography>{formatDateTime(detailsAppointment.endTime)}</Typography></Box>
              <Box className="record-detail-field record-detail-notes"><Typography variant="caption">מיקום</Typography><Typography>{detailsAppointment.location || 'לא צוין'}</Typography></Box>
            </Box>
          </DialogContent>
          <DialogActions className="record-details-actions">
            <Button color="error" startIcon={<Delete />} onClick={() => handleDelete(detailsAppointment.id)}>מחיקה</Button>
            <Button startIcon={<Edit />} onClick={() => { const appointmentToEdit = detailsAppointment; setDetailsAppointment(null); openEdit(appointmentToEdit) }}>עריכה</Button>
            <Button onClick={() => setDetailsAppointment(null)}>סגירה</Button>
          </DialogActions>
        </>}
      </Dialog>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><Box component="form" onSubmit={handleSubmit}><DialogTitle>{editingId ? 'עריכת פגישה' : 'הוספת פגישה'}</DialogTitle><DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
        <TextField select name="customerId" label="לקוח" value={appointment.customerId} onChange={handleChange} required={appointmentRequired.includes('customerId')}><MenuItem value="">{appointmentRequired.includes('customerId') ? 'בחר לקוח' : 'ללא לקוח'}</MenuItem>{customers.filter((item) => !item.isDeleted).map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}<QuickCreateCustomerOption onClick={() => setQuickCreateCustomerOpen(true)} /></TextField>
        <TextField name="title" label="כותרת" value={appointment.title} onChange={handleChange} required={appointmentTitleRequired} /><TextField name="startTime" type="datetime-local" label="שעת התחלה" value={appointment.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required /><TextField name="endTime" type="datetime-local" label="שעת סיום" value={appointment.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required /><TextField name="location" label="מיקום" value={appointment.location} onChange={handleChange} required={appointmentRequired.includes('location')} /><TextField select name="status" label="סטטוס" value={appointment.status} onChange={handleChange}>{appointmentStatuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
      </DialogContent><DialogActions>{editingId && <Button color="error" startIcon={<Delete />} onClick={() => handleDelete(editingId)}>מחיקה</Button>}<Button onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions></Box></Dialog>
      <QuickCreateCustomer open={quickCreateCustomerOpen} onClose={() => setQuickCreateCustomerOpen(false)} onCreated={handleCustomerCreated} picklists={picklists} user={user} />
      </Box>
    </Box>
  )
}

export default AppointmentsList