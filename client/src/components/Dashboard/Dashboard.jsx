import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

// יבואי MUI
import { AccessTime, Event, People, TaskAlt } from "@mui/icons-material"
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material"
import { getAppointments, getCustomers, getHealth, getTasks, getTimers } from "../../api"

const Dashboard = ({ user }) => {
  const [apiStatus, setApiStatus] = useState('loading')
  const [data, setData] = useState({ customers: [], tasks: [], appointments: [], timers: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [customers, tasks, appointments, timers] = await Promise.all([
          getCustomers(), getTasks(), getAppointments(), getTimers()
        ])
        setData({ customers, tasks, appointments, timers })
        setApiStatus('online')
      } catch (requestError) {
        setApiStatus('offline')
        setError(requestError.response?.data?.error || 'לא ניתן לטעון את נתוני הדשבורד')
      } finally {
        setIsLoading(false)
      }
    }

    getHealth().catch(() => setApiStatus('offline'))
    loadDashboard()
  }, [])

  const cards = [
    { label: 'לקוחות', value: data.customers.length, icon: <People color="primary" fontSize="large" /> },
    { label: 'משימות פתוחות', value: data.tasks.filter((item) => item.status !== 'COMPLETED' && item.status !== 'DELETED').length, icon: <TaskAlt color="secondary" fontSize="large" /> },
    { label: 'פגישות', value: data.appointments.filter((item) => item.status === 'SCHEDULED').length, icon: <Event color="success" fontSize="large" /> },
    { label: 'טיימרים פעילים', value: data.timers.filter((item) => item.status === 'RUNNING').length, icon: <AccessTime color="warning" fontSize="large" /> },
  ]

  const visibleTasks = data.tasks.filter((item) => item.status !== 'COMPLETED' && item.status !== 'DELETED').slice(0, 5)
  const visibleAppointments = data.appointments.filter((item) => item.status === 'SCHEDULED').slice(0, 5)

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>{user.businessName}</Typography>
      {apiStatus === 'loading' && <CircularProgress size={24} />}
      {apiStatus === 'online' && <Alert severity="success" sx={{ mb: 3 }}>החיבור לשרת פעיל</Alert>}
      {apiStatus === 'offline' && <Alert severity="warning" sx={{ mb: 3 }}>לא ניתן להתחבר כרגע לשרת</Alert>}
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
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">משימות פתוחות</Typography>
              <Button component={Link} to="/tasks" size="small">לכל המשימות</Button>
            </Box>
            <Stack spacing={1}>
              {visibleTasks.length ? visibleTasks.map((item) => (
                <Box key={item.id} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography fontWeight="bold">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.priority} | {item.status}</Typography>
                </Box>
              )) : <Typography color="text.secondary">אין משימות פתוחות</Typography>}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">פגישות קרובות</Typography>
              <Button component={Link} to="/appointments" size="small">לכל הפגישות</Button>
            </Box>
            <Stack spacing={1}>
              {visibleAppointments.length ? visibleAppointments.map((item) => (
                <Box key={item.id} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography fontWeight="bold">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.startTime}</Typography>
                </Box>
              )) : <Typography color="text.secondary">אין פגישות מתוזמנות</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>}
    </Box>
  )
}

export default Dashboard