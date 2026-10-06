import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { AccessTime, Event, Pause, People, Stop, TaskAlt, Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Paper, Stack, Typography } from "../Shared/PrimeUI"
import { changeSubtaskTimerStatus, getAppointments, getCustomers, getTasks } from "../../api"
import { formatDateTime } from '../../dateFormat'

const Dashboard = ({ user, picklists }) => {
  const includeSubtaskTimers = user?.includeSubtaskTimers !== false
  const taskStatuses = picklists?.taskStatus || []
  const taskPriorities = picklists?.taskPriority || []
  const [data, setData] = useState({ customers: [], tasks: [], appointments: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [appointmentView, setAppointmentView] = useState('today')

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

  const handleTimerStatus = async (action) => {
    if (!activeTimer) return
    try {
      await changeSubtaskTimerStatus(activeTimer.taskId, activeTimer.subtaskIndex, action)
      await loadDashboard()
    } catch {
      setError('לא ניתן לעדכן את הטיימר כרגע')
    }
  }

  const cards = [
    { label: 'לקוחות', value: data.customers.length, icon: <People color="primary" fontSize="large" /> },
    { label: 'משימות פתוחות', value: data.tasks.filter((item) => item.status !== 'COMPLETED' && item.status !== 'DELETED').length, icon: <TaskAlt color="secondary" fontSize="large" /> },
    { label: 'פגישות', value: data.appointments.filter((item) => item.status === 'SCHEDULED').length, icon: <Event color="success" fontSize="large" /> },
    ...(includeSubtaskTimers ? [{ label: 'טיימר פעיל', value: data.tasks.some((task) => (task.subtasks || []).some((subtask) => subtask.status === 'RUNNING')) ? '✓' : '✕', icon: <AccessTime color="warning" fontSize="large" /> }] : []),
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

  const visibleTasks = data.tasks.filter((item) => item.status !== 'COMPLETED' && item.status !== 'DELETED').slice(0, 5)
  const activeTimer = includeSubtaskTimers ? data.tasks.flatMap((task) => (task.subtasks || []).map((subtask, subtaskIndex) => ({
    ...subtask,
    taskTitle: task.title,
    taskId: task.id,
    subtaskIndex
  }))).find((subtask) => subtask.status === 'RUNNING') : null
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
        לוח בקרה
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {isLoading && <Box display="flex" justifyContent="center" sx={{ py: 4 }}><CircularProgress /></Box>}
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card elevation={1}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary">{card.label}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                </Box>
                {card.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {!isLoading && <Grid container spacing={3} sx={{ mt: 1 }}>
        {includeSubtaskTimers && <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight="bold">הטיימר הפעיל</Typography>
            </Box>
            {activeTimer ? (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography fontWeight="bold">{activeTimer.title}</Typography>
                <Typography variant="body2" color="text.secondary">משימה: {activeTimer.taskTitle || 'ללא'}</Typography>
                <Typography variant="body2" color="text.secondary">משך כולל: {activeTimer.totalDuration || 0} שניות</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button variant="outlined" color="warning" startIcon={<Pause />} onClick={() => handleTimerStatus('pause')}>השהיה</Button>
                  <Button variant="contained" color="error" startIcon={<Stop />} onClick={() => handleTimerStatus('complete')}>סיום</Button>
                </Stack>
              </Box>
            ) : <Typography color="text.secondary">אין טיימר פעיל</Typography>}
          </Paper>
        </Grid>}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">משימות פתוחות</Typography>
              <Button component={Link} to="/tasks" size="small">לכל המשימות</Button>
            </Box>
            <Stack spacing={1}>
              {visibleTasks.length ? visibleTasks.map((item) => (
                <Box key={item.id} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography component={Link} to={`/tasks?taskId=${item.id}`} fontWeight="bold" color="primary" sx={{ textDecoration: 'none' }}>{item.title || 'ללא כותרת'}</Typography>
                  <Typography variant="body2" color="text.secondary">{taskPriorities.find((option) => option.value === item.priority)?.label || item.priority} | {taskStatuses.find((option) => option.value === item.status)?.label || item.status}</Typography>
                </Box>
              )) : <Typography color="text.secondary">אין משימות פתוחות</Typography>}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">פגישות קרובות</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <Button size="small" variant={appointmentView === 'today' ? 'contained' : 'outlined'} onClick={() => setAppointmentView('today')}>היום</Button>
                <Button size="small" variant={appointmentView === 'tomorrow' ? 'contained' : 'outlined'} onClick={() => setAppointmentView('tomorrow')}>מחר</Button>
                <Button size="small" variant={appointmentView === 'week' ? 'contained' : 'outlined'} onClick={() => setAppointmentView('week')}>השבוע הקרוב</Button>
                <Button component={Link} to="/appointments" size="small">לכל הפגישות</Button>
              </Box>
            </Box>
            <Stack spacing={1}>
              {visibleAppointments.length ? visibleAppointments.map((item) => (
                <Box key={item.id} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography component={Link} to={`/appointments?appointmentId=${item.id}`} fontWeight="bold" color="primary" sx={{ textDecoration: 'none' }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatDateTime(item.startTime)}</Typography>
                </Box>
              )) : <Typography color="text.secondary">אין פגישות {appointmentView === 'today' ? 'להיום' : appointmentView === 'tomorrow' ? 'למחר' : 'בשבוע הקרוב'}</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>}
    </Box>
  )
}

export default Dashboard