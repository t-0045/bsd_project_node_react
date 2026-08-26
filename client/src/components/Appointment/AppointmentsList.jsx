import { useEffect, useState } from "react"

// יבואי MUI
import { Add, Delete, Edit, Search } from "@mui/icons-material"
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Fab, IconButton, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material"
import { createAppointment, deleteAppointment, getAppointments, getCustomers, updateAppointment } from "../../api"

const emptyAppointment = { customerId: '', title: '', startTime: '', endTime: '', location: '', status: 'SCHEDULED' }

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([])
  const [customers, setCustomers] = useState([])
  const [appointment, setAppointment] = useState(emptyAppointment)
  const [val, setVal] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAppointments = async () => {
    try { setAppointments(await getAppointments()) }
    catch (requestError) { setError(requestError.response?.data?.error || 'Failed to fetch appointments') }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchAppointments(), getCustomers().then(setCustomers)])
    }
    loadData()
  }, [])

  const openAdd = () => { setAppointment({ ...emptyAppointment, customerId: customers[0]?.id || '' }); setEditingId(null); setOpen(true) }
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

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>
  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">Appointments</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField fullWidth placeholder="Search appointments..." value={val} onChange={(event) => setVal(event.target.value)} sx={{ mb: 3, backgroundColor: 'background.paper' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
      <Stack spacing={2} sx={{ mb: 4 }}>
        {appointments.filter((item) => item.title.toLowerCase().includes(val.toLowerCase())).map((item) => (
          <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box><Typography fontWeight="bold">{item.title}</Typography><Typography variant="body2" color="text.secondary">{customerName(item.customerId)} | {item.startTime} | {item.status}</Typography></Box>
            <Box><IconButton color="primary" onClick={() => openEdit(item)}><Edit /></IconButton><IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Box>
          </Paper>
        ))}
      </Stack>
      <Fab color="primary" aria-label="add appointment" onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}><Add /></Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><Box component="form" onSubmit={handleSubmit}><DialogTitle>{editingId ? 'Edit appointment' : 'Add appointment'}</DialogTitle><DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
        <TextField select name="customerId" label="Customer" value={appointment.customerId} onChange={handleChange} required>{customers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}</TextField>
        <TextField name="title" label="Title" value={appointment.title} onChange={handleChange} required /><TextField name="startTime" type="datetime-local" label="Start time" value={appointment.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required /><TextField name="endTime" type="datetime-local" label="End time" value={appointment.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} required /><TextField name="location" label="Location" value={appointment.location} onChange={handleChange} /><TextField select name="status" label="Status" value={appointment.status} onChange={handleChange}><MenuItem value="SCHEDULED">Scheduled</MenuItem><MenuItem value="COMPLETED">Completed</MenuItem><MenuItem value="CANCELLED">Cancelled</MenuItem></TextField>
      </DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Save</Button></DialogActions></Box></Dialog>
    </Box>
  )
}

export default AppointmentsList