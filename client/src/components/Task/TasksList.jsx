import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

// יבואי MUI
import { Add, Delete, Edit, Search } from "@mui/icons-material"
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Fab, IconButton, InputAdornment, MenuItem, Paper, Stack,
  TextField, Typography
} from "@mui/material"
import { createTask, deleteTask, getCustomers, getTasks, updateTask } from "../../api"

const emptyTask = { customerId: '', title: '', priority: 'MEDIUM', status: 'OPEN', dueDate: '' }

const TasksList = () => {
  const [tasks, setTasks] = useState([])
  const [customers, setCustomers] = useState([])
  const [val, setVal] = useState("")
  const [task, setTask] = useState(emptyTask)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const customerIdFromUrl = searchParams.get('customerId') || ''
  const activeCustomers = customers.filter((item) => item.status === 'ACTIVE')

  const fetchTasks = async () => {
    try { setTasks(await getTasks()) }
    catch (requestError) { setError(requestError.response?.data?.error || 'Failed to fetch tasks') }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTasks, loadedCustomers] = await Promise.all([getTasks(), getCustomers()])
        setTasks(loadedTasks)
        setCustomers(loadedCustomers)
        if (customerIdFromUrl && loadedCustomers.some((item) => item.id === customerIdFromUrl && item.status === 'ACTIVE')) {
          setTask({ ...emptyTask, customerId: customerIdFromUrl })
          setEditingId(null)
          setOpen(true)
        }
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Failed to fetch tasks')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [customerIdFromUrl])

  const openAdd = () => { setTask({ ...emptyTask, customerId: customerIdFromUrl }); setEditingId(null); setOpen(true) }
  const openEdit = (selectedTask) => { setTask({ ...emptyTask, ...selectedTask }); setEditingId(selectedTask.id); setOpen(true) }
  const handleChange = ({ target }) => setTask({ ...task, [target.name]: target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingId) await updateTask(editingId, task)
      else await createTask(task)
      setOpen(false)
      fetchTasks()
    } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to save task') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    await deleteTask(id)
    fetchTasks()
  }

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">Tasks</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField fullWidth placeholder="Search tasks..." value={val} onChange={(event) => setVal(event.target.value)} sx={{ mb: 3, backgroundColor: 'background.paper' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
      <Stack spacing={2} sx={{ mb: 4 }}>
        {tasks.filter((item) => item.title.toLowerCase().includes(val.toLowerCase())).map((item) => (
          <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box><Typography fontWeight="bold">{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.priority} | {item.status}</Typography></Box>
            <Box><IconButton color="primary" onClick={() => openEdit(item)}><Edit /></IconButton><IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Box>
          </Paper>
        ))}
      </Stack>
      <Fab color="primary" aria-label="add task" onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}><Add /></Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Edit task' : 'Add task'}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField select name="customerId" label="Customer" value={task.customerId} onChange={handleChange}>
              <MenuItem value="">No customer</MenuItem>
              {activeCustomers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}
            </TextField>
            <TextField name="title" label="Title" value={task.title} onChange={handleChange} required />
            <TextField select name="priority" label="Priority" value={task.priority} onChange={handleChange}><MenuItem value="LOW">Low</MenuItem><MenuItem value="MEDIUM">Medium</MenuItem><MenuItem value="HIGH">High</MenuItem><MenuItem value="URGENT">Urgent</MenuItem></TextField>
            <TextField select name="status" label="Status" value={task.status} onChange={handleChange}><MenuItem value="OPEN">Open</MenuItem><MenuItem value="IN_PROGRESS">In progress</MenuItem><MenuItem value="COMPLETED">Completed</MenuItem><MenuItem value="DELETED">Deleted</MenuItem></TextField>
            <TextField name="dueDate" type="datetime-local" label="Due date" value={task.dueDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </DialogContent>
          <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Save</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default TasksList