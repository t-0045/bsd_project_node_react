import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

// יבואי MUI
import { Add, Delete, Edit, Pause, PlayArrow, Stop, Search } from "@mui/icons-material"
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Fab, IconButton, InputAdornment, MenuItem, Paper,
  Stack, TextField, Typography
} from "@mui/material"
import { changeSubtaskTimerStatus, createTask, deleteTask, getCustomers, getTasks, updateTask } from "../../api"

const emptyTask = { customerId: '', title: '', priority: 'MEDIUM', status: 'OPEN', startDate: '', dueDate: '', notes: '', subtasks: [] }

const TasksList = () => {
  const [tasks, setTasks] = useState([])
  const [customers, setCustomers] = useState([])
  const [val, setVal] = useState("")
  const [task, setTask] = useState(emptyTask)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [subtaskStartDate, setSubtaskStartDate] = useState('')
  const [subtaskDueDate, setSubtaskDueDate] = useState('')
  const [completionQuestion, setCompletionQuestion] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const customerIdFromUrl = searchParams.get('customerId') || ''
  const taskIdFromUrl = searchParams.get('taskId') || ''
  const availableCustomers = customers.filter((item) => !item.isDeleted)

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
        const taskFromUrl = taskIdFromUrl && loadedTasks.find((item) => item.id === taskIdFromUrl)
        if (taskFromUrl) {
          setTask({ ...emptyTask, ...taskFromUrl })
          setEditingId(taskFromUrl.id)
          setOpen(true)
          setSearchParams({}, { replace: true })
        } else if (customerIdFromUrl && loadedCustomers.some((item) => item.id === customerIdFromUrl)) {
          setTask({ ...emptyTask, customerId: customerIdFromUrl })
          setEditingId(null)
          setOpen(true)
          setSearchParams({}, { replace: true })
        }
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Failed to fetch tasks')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [customerIdFromUrl, taskIdFromUrl, setSearchParams])

  const openAdd = () => { setTask({ ...emptyTask, customerId: '' }); setEditingId(null); setOpen(true) }
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

  const openAddSubtask = (selectedTaskItem) => {
    setSelectedTask(selectedTaskItem)
    setSubtaskTitle('')
    setSubtaskStartDate('')
    setSubtaskDueDate('')
    setSubtaskDialogOpen(true)
  }

  const handleAddSubtask = async (event) => {
    event.preventDefault()
    const title = subtaskTitle.trim()
    if (!title || !subtaskStartDate || !selectedTask) return
    try {
      await updateTask(selectedTask.id, {
        subtasks: [...(selectedTask.subtasks || []), {
          title,
          startDate: subtaskStartDate,
          dueDate: subtaskDueDate || null,
          completed: false
        }]
      })
      setSubtaskDialogOpen(false)
      fetchTasks()
    } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to add subtask') }
  }

  const handleToggleSubtask = async (selectedTaskItem, subtaskIndex) => {
    try {
      const selectedSubtask = selectedTaskItem.subtasks?.[subtaskIndex]
      const isCompleting = selectedSubtask && !selectedSubtask.completed
      let taskToUpdate = selectedTaskItem

      if (isCompleting && selectedSubtask.status === 'RUNNING') {
        taskToUpdate = await changeSubtaskTimerStatus(selectedTaskItem.id, subtaskIndex, 'complete')
      }

      const subtasks = (taskToUpdate.subtasks || []).map((subtask, index) => (
        index === subtaskIndex ? { ...subtask, completed: !selectedSubtask.completed } : subtask
      ))
      await updateTask(selectedTaskItem.id, { subtasks })
      const allSubtasksCompleted = subtasks.length > 0 && subtasks.every((subtask) => subtask.completed)
      if (isCompleting && allSubtasksCompleted && selectedTaskItem.status !== 'COMPLETED') {
        setCompletionQuestion({ taskId: selectedTaskItem.id, taskTitle: selectedTaskItem.title })
      }
      fetchTasks()
    } catch (requestError) { setError(requestError.response?.data?.error || 'Failed to update subtask') }
  }

  const handleSubtaskTimer = async (selectedTaskItem, subtaskIndex, action) => {
    try {
      await changeSubtaskTimerStatus(selectedTaskItem.id, subtaskIndex, action)
      fetchTasks()
    } catch (requestError) { setError(requestError.response?.data?.error || 'לא ניתן לעדכן את הטיימר') }
  }

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">משימות</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField fullWidth placeholder="חיפוש משימות..." value={val} onChange={(event) => setVal(event.target.value)} sx={{ mb: 3, backgroundColor: 'background.paper' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
      <Stack spacing={2} sx={{ mb: 4 }}>
        {tasks.filter((item) => item.title.toLowerCase().includes(val.toLowerCase())).map((item) => (
          <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight="bold">{item.title}</Typography>
              <Typography variant="body2" color="text.secondary">מזהה: {item.id} | לקוח: {customers.find((customer) => customer.id === item.customerId)?.fullName || 'ללא'}</Typography>
              <Typography variant="body2" color="text.secondary">עדיפות: {{ LOW: 'נמוכה', MEDIUM: 'בינונית', HIGH: 'גבוהה', URGENT: 'דחופה' }[item.priority] || item.priority} | סטטוס: {{ OPEN: 'פתוחה', IN_PROGRESS: 'בתהליך', COMPLETED: 'הושלמה', DELETED: 'נמחקה' }[item.status] || item.status}</Typography>
              <Typography variant="body2" color="text.secondary">טווח: {item.startDate || 'ללא'} עד {item.dueDate || 'ללא'} | נמחקה: {item.isDeleted ? 'כן' : 'לא'}</Typography>
              <Typography variant="body2" color="text.secondary">הערות: {item.notes || 'ללא'}</Typography>
              <Stack spacing={0.25} sx={{ mt: 1 }}>
                {(item.subtasks || []).map((subtask, subtaskIndex) => (
                  <Box key={`${item.id}-subtask-${subtaskIndex}`} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox size="small" checked={Boolean(subtask.completed)} onChange={() => handleToggleSubtask(item, subtaskIndex)} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ textDecoration: subtask.completed ? 'line-through' : 'none' }}>{subtask.title} | התחלה: {subtask.startDate || 'ללא'} | סיום: {subtask.dueDate || 'ללא'}</Typography>
                      <Typography variant="caption" color="text.secondary">טיימר: {{ PAUSED: 'מושהה', RUNNING: 'פעיל', COMPLETED: 'הושלם' }[subtask.status] || 'מושהה'} | זמן כולל: {subtask.totalDuration || 0} שניות</Typography>
                    </Box>
                    <Box>
                      {subtask.status !== 'RUNNING' && subtask.status !== 'COMPLETED' && <IconButton size="small" color="success" aria-label={subtask.status === 'PAUSED' && subtask.sessions?.length ? 'המשך טיימר' : 'הפעל טיימר'} onClick={() => handleSubtaskTimer(item, subtaskIndex, 'start')}><PlayArrow /></IconButton>}
                      {subtask.status === 'RUNNING' && <IconButton size="small" color="warning" aria-label="השהה טיימר" onClick={() => handleSubtaskTimer(item, subtaskIndex, 'pause')}><Pause /></IconButton>}
                      {subtask.status !== 'COMPLETED' && <IconButton size="small" color="error" aria-label="סיים טיימר" onClick={() => handleSubtaskTimer(item, subtaskIndex, 'complete')}><Stop /></IconButton>}
                    </Box>
                  </Box>
                ))}
                <Typography variant="body2" color="text.secondary">משימות משנה: {(item.subtasks || []).length}</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => openAddSubtask(item)} sx={{ alignSelf: 'flex-start' }}>הוספת משימת משנה</Button>
              </Stack>
            </Box>
            <Box><IconButton color="primary" onClick={() => openEdit(item)}><Edit /></IconButton><IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Box>
          </Paper>
        ))}
      </Stack>
      <Fab color="primary" aria-label="add task" onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}><Add /></Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'עריכת משימה' : 'הוספת משימה'}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField select name="customerId" label="לקוח" value={task.customerId} onChange={handleChange}>
              <MenuItem value="">ללא לקוח</MenuItem>
              {availableCustomers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}
            </TextField>
            <TextField name="title" label="כותרת" value={task.title} onChange={handleChange} required />
            <TextField select name="priority" label="עדיפות" value={task.priority} onChange={handleChange}><MenuItem value="LOW">נמוכה</MenuItem><MenuItem value="MEDIUM">בינונית</MenuItem><MenuItem value="HIGH">גבוהה</MenuItem><MenuItem value="URGENT">דחופה</MenuItem></TextField>
            <TextField select name="status" label="סטטוס" value={task.status} onChange={handleChange}><MenuItem value="OPEN">פתוחה</MenuItem><MenuItem value="IN_PROGRESS">בתהליך</MenuItem><MenuItem value="COMPLETED">הושלמה</MenuItem><MenuItem value="DELETED">נמחקה</MenuItem></TextField>
            <TextField name="startDate" type="datetime-local" label="תאריך התחלה" value={task.startDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
            <TextField name="dueDate" type="datetime-local" label="תאריך יעד" value={task.dueDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
            <TextField name="notes" label="הערות" value={task.notes || ''} onChange={handleChange} multiline rows={3} />
          </DialogContent>
          <DialogActions><Button onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions>
        </Box>
      </Dialog>
      <Dialog open={subtaskDialogOpen} onClose={() => setSubtaskDialogOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleAddSubtask}>
          <DialogTitle>הוספת משימת משנה</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField autoFocus fullWidth name="subtaskTitle" label="כותרת" value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} required />
            <TextField fullWidth name="subtaskStartDate" type="datetime-local" label="תאריך התחלה" value={subtaskStartDate} onChange={(event) => setSubtaskStartDate(event.target.value)} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} />
            <TextField fullWidth name="subtaskDueDate" type="datetime-local" label="תאריך סיום" value={subtaskDueDate} onChange={(event) => setSubtaskDueDate(event.target.value)} inputProps={{ min: subtaskStartDate || undefined, max: selectedTask?.dueDate || undefined }} InputLabelProps={{ shrink: true }} sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions><Button onClick={() => setSubtaskDialogOpen(false)}>ביטול</Button><Button type="submit" variant="contained">הוספה</Button></DialogActions>
        </Box>
      </Dialog>
      <Dialog open={Boolean(completionQuestion)} onClose={() => setCompletionQuestion(null)} fullWidth maxWidth="xs">
        <DialogTitle>האם המשימה הושלמה?</DialogTitle>
        <DialogContent>
          <Typography>האם המשימה „{completionQuestion?.taskTitle}” הושלמה?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={async () => {
            if (!completionQuestion) return
            try {
              await updateTask(completionQuestion.taskId, { status: 'IN_PROGRESS' })
              setCompletionQuestion(null)
              fetchTasks()
            } catch (requestError) { setError(requestError.response?.data?.error || 'לא ניתן לעדכן את המשימה') }
          }}>לא</Button>
          <Button variant="contained" onClick={async () => {
            if (!completionQuestion) return
            try {
              await updateTask(completionQuestion.taskId, { status: 'COMPLETED' })
              setCompletionQuestion(null)
              fetchTasks()
            } catch (requestError) { setError(requestError.response?.data?.error || 'לא ניתן לעדכן את המשימה') }
          }}>כן</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TasksList