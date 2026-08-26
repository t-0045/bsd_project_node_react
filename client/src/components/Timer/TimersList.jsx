import { useEffect, useState } from "react"

// יבואי MUI
import { Add, Delete, Edit, Pause, PlayArrow, Stop } from "@mui/icons-material"
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Fab, IconButton, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material"
import { changeTimerStatus, createTimer, deleteTimer, getTasks, getTimers, updateTimer } from "../../api"

const emptyTimer = { taskId: '', title: '' }

const TimersList = () => {
  const [timers, setTimers] = useState([])
  const [tasks, setTasks] = useState([])
  const [timer, setTimer] = useState(emptyTimer)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTimers = async () => { try { setTimers(await getTimers()) } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to fetch timers') } finally { setIsLoading(false) } }
  useEffect(() => { const loadData = async () => { await Promise.all([fetchTimers(), getTasks().then(setTasks)]) }; loadData() }, [])
  const openAdd = () => { setTimer({ ...emptyTimer, taskId: tasks[0]?.id || '' }); setEditingId(null); setOpen(true) }
  const openEdit = (item) => { setTimer({ ...emptyTimer, ...item }); setEditingId(item.id); setOpen(true) }
  const handleChange = ({ target }) => setTimer({ ...timer, [target.name]: target.value })
  const handleSubmit = async (event) => { event.preventDefault(); try { if (editingId) await updateTimer(editingId, timer); else await createTimer(timer); setOpen(false); fetchTimers() } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to save timer') } }
  const handleStatus = async (id, action) => { try { await changeTimerStatus(id, action); fetchTimers() } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to change timer status') } }
  const handleDelete = async (id) => { if (window.confirm('Delete this timer?')) { await deleteTimer(id); fetchTimers() } }
  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>
  return <Box sx={{ position: 'relative' }}><Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">Timers</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Stack spacing={2} sx={{ mb: 4 }}>{timers.map((item) => <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography fontWeight="bold">{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.status} | {item.totalDuration}s</Typography></Box><Box>{item.status !== 'RUNNING' && item.status !== 'COMPLETED' && <IconButton color="success" onClick={() => handleStatus(item.id, 'start')}><PlayArrow /></IconButton>}{item.status === 'RUNNING' && <IconButton color="warning" onClick={() => handleStatus(item.id, 'pause')}><Pause /></IconButton>}{item.status !== 'COMPLETED' && <IconButton color="secondary" onClick={() => handleStatus(item.id, 'complete')}><Stop /></IconButton>}<IconButton color="primary" onClick={() => openEdit(item)}><Edit /></IconButton><IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Box></Paper>)}</Stack><Fab color="primary" aria-label="add timer" onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}><Add /></Fab><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><Box component="form" onSubmit={handleSubmit}><DialogTitle>{editingId ? 'Edit timer' : 'Add timer'}</DialogTitle><DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}><TextField select name="taskId" label="Task" value={timer.taskId} onChange={handleChange} required>{tasks.map((item) => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}</TextField><TextField name="title" label="Title" value={timer.title} onChange={handleChange} required /></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Save</Button></DialogActions></Box></Dialog></Box>
}

export default TimersList