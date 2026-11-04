import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { AccessTime, Event, Pause, People, Stop, TaskAlt, Alert, Box, Button, Card, CardContent, CircularProgress, Clear, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Paper, Stack, Typography } from "../Shared/PrimeUI"
import { changeSubtaskTimerStatus, getAppointments, getCustomers, getTasks, updateAppointment } from "../../api"
import { formatDate, formatDateTime } from '../../dateFormat'
import taskStatusColorValues from '../../taskStatusColors'

const Dashboard = ({ user, picklists }) => {
  const includeSubtaskTimers = user?.includeSubtaskTimers !== false
  const taskStatuses = picklists?.taskStatus || []
  const taskPriorities = picklists?.taskPriority || []
  const appointmentStatuses = picklists?.appointmentStatus || []
  const [data, setData] = useState({ customers: [], tasks: [], appointments: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [appointmentView, setAppointmentView] = useState('today')
  const [appointmentNow, setAppointmentNow] = useState(Date.now())
  const [timerNow, setTimerNow] = useState(0)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null)

  const loadDashboard = async () => {
    try {
      const [customers, tasks, appointments] = await Promise.all([
        getCustomers(), getTasks(), getAppointments()
      ])
      setData({ customers, tasks, appointments })
    } catch {
      setError('לא ניתן לטעון את נתוני לוח הבקרה כרגע')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (appointmentView !== 'today' && appointmentView !== 'overdue') return undefined
    const intervalId = window.setInterval(() => setAppointmentNow(Date.now()), 30000)
    return () => window.clearInterval(intervalId)
  }, [appointmentView])

  const activeTimer = includeSubtaskTimers ? data.tasks.flatMap((task) => (task.subtasks || []).map((subtask, subtaskIndex) => ({
    ...subtask,
    taskTitle: task.title,
    taskId: task.id,
    subtaskIndex
  }))).find((subtask) => subtask.status === 'RUNNING') : null

  useEffect(() => {
    if (!activeTimer) return undefined
    const intervalId = window.setInterval(() => setTimerNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [activeTimer?.taskId, activeTimer?.subtaskIndex])

  const activeTimerStartedAt = activeTimer ? Date.parse(activeTimer.sessions?.at(-1)?.startedAt) : NaN
  const activeTimerDuration = activeTimer
    ? (Number(activeTimer.totalDuration) || 0) + (Number.isFinite(activeTimerStartedAt) && timerNow ? Math.max(0, Math.floor((timerNow - activeTimerStartedAt) / 1000)) : 0)
    : 0
  const formatTimerDuration = (seconds) => [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60
  ].map((value) => String(value).padStart(2, '0')).join(':')

  const handleTimerStatus = async (action) => {
    if (!activeTimer) return
    try {
      await changeSubtaskTimerStatus(activeTimer.taskId, activeTimer.subtaskIndex, action)
      await loadDashboard()
    } catch {
      setError('לא ניתן לעדכן את הטיימר כרגע')
    }
  }

  const handleUpdateAppointmentStatus = async (appointment, status) => {
    setUpdatingAppointmentId(appointment.id)
    setError('')
    try {
      await updateAppointment(appointment.id, { status })
      await loadDashboard()
    } catch {
      setError('לא ניתן לעדכן את סטטוס הפגישה כרגע')
    } finally {
      setUpdatingAppointmentId(null)
    }
  }

  const cards = [
    { label: 'לקוחות', value: data.customers.length, icon: <People color="primary" fontSize="large" /> },
    { label: 'משימות פתוחות', value: data.tasks.filter((item) => !item.isDeleted && item.status !== 'COMPLETED').length, icon: <TaskAlt color="secondary" fontSize="large" /> },
    { label: 'פגישות', value: data.appointments.filter((item) => item.status === 'SCHEDULED').length, icon: <Event color="success" fontSize="large" /> },
  ]

  const getDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getAppointmentDate = (item) => {
    const date = new Date(item.startTime)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const today = new Date()
  const todayKey = getDateKey(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowKey = getDateKey(tomorrow)
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)

  const visibleTasks = data.tasks.filter((item) => !item.isDeleted && item.status !== 'COMPLETED')
  const customerName = (customerId) => data.customers.find((customer) => customer.id === customerId)?.fullName || 'ללא לקוח'
  const visibleAppointments = data.appointments
    .filter((item) => item.status === 'SCHEDULED')
    .filter((item) => {
      const appointmentDate = getAppointmentDate(item)
      if (!appointmentDate) return false
      if (appointmentView === 'today') return getDateKey(appointmentDate) === todayKey
      if (appointmentView === 'tomorrow') return getDateKey(appointmentDate) === tomorrowKey
      return appointmentDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && appointmentDate < weekEnd
    })
    .sort((first, second) => getAppointmentDate(first) - getAppointmentDate(second))
    .slice(0, 5)
  const overdueAppointments = data.appointments
    .filter((item) => item.status === 'SCHEDULED')
    .filter((item) => {
      const endDate = new Date(item.endTime)
      return !Number.isNaN(endDate.getTime()) && endDate.getTime() < appointmentNow
    })
    .sort((first, second) => new Date(first.endTime) - new Date(second.endTime))

  return (
    <Box className="dashboard-page">
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
        לוח בקרה
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {isLoading && <Box display="flex" justifyContent="center" sx={{ py: 4 }}><CircularProgress /></Box>}
      <Grid container spacing={2.5}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card className="dashboard-summary-card" elevation={1}>
              <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography color="text.secondary">{card.label}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                </Box>
                {card.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
        {includeSubtaskTimers && <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-summary-card dashboard-active-timer" elevation={1}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box className="dashboard-active-timer-header" display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="text.secondary">הטיימר הפעיל</Typography>
                <Box display="flex" alignItems="center" gap={0.75}>
                  {activeTimer && <Typography className="dashboard-active-timer-duration" aria-live="off">{formatTimerDuration(activeTimerDuration)}</Typography>}
                  <AccessTime fontSize="large" />
                </Box>
              </Box>
              <Box className="dashboard-active-timer-body">
              {activeTimer ? (
                <Box className="dashboard-active-timer-details" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.75, minWidth: 0, width: '100%' }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight="bold" noWrap>{activeTimer.title || 'תת־משימה'}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>משימה: {activeTimer.taskTitle || 'ללא כותרת'}</Typography>
                  </Box>
                  <Stack className="dashboard-active-timer-controls" direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Button size="small" variant="outlined" color="warning" startIcon={<Pause />} onClick={() => handleTimerStatus('pause')}>השהיה</Button>
                    <Button size="small" variant="contained" color="error" startIcon={<Stop />} onClick={() => handleTimerStatus('complete')}>סיום</Button>
                  </Stack>
                </Box>
              ) : <Typography color="text.secondary">אין טיימר פעיל</Typography>}
              </Box>
            </CardContent>
          </Card>
        </Grid>}
      </Grid>
      {!isLoading && <Grid container spacing={2.5} sx={{ mt: 2.5 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, height: '32rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">משימות פתוחות</Typography>
              <Button component={Link} to="/tasks" size="small">לכל המשימות</Button>
            </Box>
            <Stack className="dashboard-task-list" role="region" aria-label="רשימת משימות פתוחות" tabIndex={0} spacing={0.75} sx={{ flex: '1 1 0%', minHeight: 0, boxSizing: 'border-box', overflowY: 'auto', pr: 0.5 }}>
              {visibleTasks.length ? visibleTasks.map((item) => (
                <Paper key={item.id} role="button" tabIndex={0} aria-label={`פתיחת פרטי המשימה ${item.title || 'ללא כותרת'}`} onClick={() => setSelectedTask(item)} onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedTask(item)
                  }
                }} variant="outlined" style={{ backgroundColor: taskStatusColorValues[taskPriorities.find((priority) => priority.value === item.priority)?.color] || '#ffffff' }} sx={{ p: 1, borderRadius: 1, flex: '0 0 auto', cursor: 'pointer' }}>
                  <Typography fontWeight="bold" color="primary">{item.title || 'ללא כותרת'}</Typography>
                  <Typography variant="body2" color="text.secondary">{taskPriorities.find((option) => option.value === item.priority)?.label || item.priority} | {taskStatuses.find((option) => option.value === item.status)?.label || item.status} | תאריך יעד: {formatDate(item.dueDate)}</Typography>
                </Paper>
              )) : <Typography color="text.secondary">אין משימות פתוחות</Typography>}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, height: '32rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">פגישות קרובות</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button size="small" variant={appointmentView === 'overdue' ? 'contained' : 'outlined'} onClick={() => setAppointmentView('overdue')}>פגישות שעבר מועדן ({overdueAppointments.length})</Button>
                <Button size="small" variant={appointmentView === 'today' ? 'contained' : 'outlined'} onClick={() => setAppointmentView('today')}>היום</Button>
                <Button size="small" variant={appointmentView === 'tomorrow' ? 'contained' : 'outlined'} onClick={() => setAppointmentView('tomorrow')}>מחר</Button>
                <Button size="small" variant={appointmentView === 'week' ? 'contained' : 'outlined'} onClick={() => setAppointmentView('week')}>השבוע הקרוב</Button>
                <Button component={Link} to="/appointments" size="small">לכל הפגישות</Button>
              </Box>
            </Box>
            <Stack className="dashboard-appointment-list" role="region" aria-label="רשימת פגישות קרובות" tabIndex={0} spacing={1.25} sx={{ flex: '1 1 0%', minHeight: 0, boxSizing: 'border-box', overflowY: 'auto', pr: 0.5 }}>
              {(appointmentView === 'overdue' ? overdueAppointments : visibleAppointments).length ? (appointmentView === 'overdue' ? overdueAppointments : visibleAppointments).map((item) => (
                <Paper key={item.id} className="dashboard-appointment-tile" role="button" tabIndex={0} aria-label={`פתיחת פרטי הפגישה ${item.title || 'ללא כותרת'}`} onClick={() => setSelectedAppointment(item)} onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedAppointment(item)
                  }
                }} variant="outlined" sx={{ p: 1.5, borderRadius: 1, flex: '0 0 auto', cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight="bold" color="primary">{item.title || 'ללא כותרת'}</Typography>
                    {(appointmentView === 'overdue' || (appointmentView === 'today' && new Date(item.endTime).getTime() <= appointmentNow)) && <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Button size="small" variant="outlined" disabled={updatingAppointmentId === item.id} onClick={(event) => { event.stopPropagation(); handleUpdateAppointmentStatus(item, 'COMPLETED') }}>הושלמה</Button>
                      <Button size="small" variant="outlined" color="error" disabled={updatingAppointmentId === item.id} onClick={(event) => { event.stopPropagation(); handleUpdateAppointmentStatus(item, 'CANCELLED') }}>נדחתה</Button>
                    </Box>}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{formatDateTime(item.startTime)}</Typography>
                </Paper>
              )) : <Typography color="text.secondary">{appointmentView === 'overdue' ? 'אין פגישות פתוחות שעבר מועדן' : `אין פגישות ${appointmentView === 'today' ? 'להיום' : appointmentView === 'tomorrow' ? 'למחר' : 'בשבוע הקרוב'}`}</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>}
      <Dialog className="record-details-dialog" open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} fullWidth maxWidth="sm">
        {selectedTask && <>
          <DialogTitle><span>{selectedTask.title || 'ללא כותרת'}</span><IconButton className="dialog-close-button" aria-label="סגירה" onClick={() => setSelectedTask(null)}><Clear /></IconButton></DialogTitle>
          <DialogContent className="record-details-content">
            <Box className="record-details-grid">
              <Box className="record-detail-field"><Typography variant="caption">לקוח</Typography><Typography>{customerName(selectedTask.customerId)}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">סטטוס</Typography><Typography>{taskStatuses.find((option) => option.value === selectedTask.status)?.label || selectedTask.status}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">עדיפות</Typography><Typography>{taskPriorities.find((option) => option.value === selectedTask.priority)?.label || selectedTask.priority}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">תאריך יעד</Typography><Typography>{formatDateTime(selectedTask.dueDate)}</Typography></Box>
              <Box className="record-detail-field record-detail-notes"><Typography variant="caption">הערות</Typography><Typography>{selectedTask.notes || 'אין הערות'}</Typography></Box>
            </Box>
            <Typography variant="h6" className="record-details-section-title">משימות משנה ({(selectedTask.subtasks || []).length})</Typography>
            {(selectedTask.subtasks || []).length === 0 && <Typography variant="body2" color="text.secondary">אין משימות משנה</Typography>}
            {(selectedTask.subtasks || []).map((subtask, index) => (
              <Paper key={`${selectedTask.id}-detail-subtask-${index}`} className="record-detail-subtask" sx={{ p: 1.5, display: 'grid', gap: 0.5 }}>
                <Typography fontWeight="bold">{subtask.title || 'משימת משנה'}{subtask.completed ? ' · הושלמה' : ''}</Typography>
                <Typography variant="body2" color="text.secondary">התחלה: {formatDateTime(subtask.startDate)} | סיום: {formatDateTime(subtask.dueDate)}</Typography>
                {subtask.details && <Typography variant="body2">פירוט: {subtask.details}</Typography>}
                {subtask.notes && <Typography variant="body2">{subtask.notes}</Typography>}
              </Paper>
            ))}
          </DialogContent>
          <DialogActions className="record-details-actions">
            <Button component={Link} to={`/tasks?taskId=${selectedTask.id}`} variant="contained">מעבר לעמוד המשימות</Button>
          </DialogActions>
        </>}
      </Dialog>
      <Dialog className="record-details-dialog" open={Boolean(selectedAppointment)} onClose={() => setSelectedAppointment(null)} fullWidth maxWidth="sm">
        {selectedAppointment && <>
          <DialogTitle><span>{selectedAppointment.title || 'ללא כותרת'}</span><IconButton className="dialog-close-button" aria-label="סגירה" onClick={() => setSelectedAppointment(null)}><Clear /></IconButton></DialogTitle>
          <DialogContent className="record-details-content">
            <Box className="record-details-grid">
              <Box className="record-detail-field"><Typography variant="caption">לקוח</Typography><Typography>{selectedAppointment.customerId ? customerName(selectedAppointment.customerId) : 'ללא לקוח'}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">סטטוס</Typography><Typography>{appointmentStatuses.find((option) => option.value === selectedAppointment.status)?.label || selectedAppointment.status}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">התחלה</Typography><Typography>{formatDateTime(selectedAppointment.startTime)}</Typography></Box>
              <Box className="record-detail-field"><Typography variant="caption">סיום</Typography><Typography>{formatDateTime(selectedAppointment.endTime)}</Typography></Box>
              <Box className="record-detail-field record-detail-notes"><Typography variant="caption">מיקום</Typography><Typography>{selectedAppointment.location || 'לא צוין'}</Typography></Box>
            </Box>
          </DialogContent>
          <DialogActions className="record-details-actions">
            <Button component={Link} to={`/appointments?appointmentId=${selectedAppointment.id}`} variant="contained">מעבר לעמוד הפגישות</Button>
          </DialogActions>
        </>}
      </Dialog>
    </Box>
  )
}

export default Dashboard