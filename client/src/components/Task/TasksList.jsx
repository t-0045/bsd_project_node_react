import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Add, Clear, Delete, Edit, ExpandLess, ExpandMore, Pause, PlayArrow, Stop, Search, Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Fab, IconButton, InputAdornment, MenuItem, Paper,
  Stack, TextField, Typography
} from "../Shared/PrimeUI"
import { changeSubtaskTimerStatus, createTask, deleteTask, getCustomers, getTasks, updateTask } from "../../api"
import { formatDateTime } from '../../dateFormat'
import QuickCreateCustomer, { QuickCreateCustomerOption } from '../Customer/QuickCreateCustomer'

const emptyTask = { customerId: '', title: '', priority: 'MEDIUM', status: 'OPEN', dueDate: '', notes: '', subtasks: [] }
const initialFilters = { text: '', customerId: '', priority: '', status: '', fromDate: '', toDate: '' }
const localDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const nextMinute = () => {
  const date = new Date()
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)
  return date
}
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
}

const TasksList = ({ user, picklists }) => {
  const includeSubtaskTimers = user?.includeSubtaskTimers !== false
  const taskRequired = user?.requiredFields?.task ?? ['title']
  const taskStatuses = picklists?.taskStatus || []
  const taskPriorities = picklists?.taskPriority || []
  const subtaskTypes = picklists?.subtaskType || []
  const subtaskRequired = user?.requiredFields?.subtask ?? ['type']
  const taskTitleRequired = user?.requiredFields?.task?.includes('title') ?? true
  const [tasks, setTasks] = useState([])
  const [customers, setCustomers] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [task, setTask] = useState(emptyTask)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [quickCreateCustomerOpen, setQuickCreateCustomerOpen] = useState(false)
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [subtaskType, setSubtaskType] = useState('')
  const [subtaskNotes, setSubtaskNotes] = useState('')
  const [subtaskStartDate, setSubtaskStartDate] = useState('')
  const [subtaskDueDate, setSubtaskDueDate] = useState('')
  const [completionQuestion, setCompletionQuestion] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [timerNow, setTimerNow] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const customerIdFromUrl = searchParams.get('customerId') || ''
  const taskIdFromUrl = searchParams.get('taskId') || ''
  const availableCustomers = customers.filter((item) => !item.isDeleted)
  const customerName = (id) => customers.find((customer) => customer.id === id)?.fullName || ''
  const filteredTasks = tasks.filter((item) => {
    const text = filters.text.trim().toLowerCase()
    const searchableText = `${item.title} ${item.notes || ''} ${item.customerId || ''} ${customerName(item.customerId)}`.toLowerCase()
    if (text && !searchableText.includes(text)) return false
    if (filters.customerId && item.customerId !== filters.customerId) return false
    if (filters.priority && item.priority !== filters.priority) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.toDate && (!item.dueDate || item.dueDate.slice(0, 10) > filters.toDate)) return false
    return true
  })
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }))
  const clearFilters = () => setFilters(initialFilters)

  const fetchTasks = async () => {
    try { setTasks(await getTasks()) }
    catch (requestError) { setError(requestError.response?.data?.error || 'Failed to fetch tasks') }
    finally { setIsLoading(false) }
  }

  const hasRunningTimer = tasks.some((item) => item.subtasks?.some((subtask) => subtask.status === 'RUNNING'))

  useEffect(() => {
    if (!hasRunningTimer) return undefined
    const intervalId = window.setInterval(() => setTimerNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [hasRunningTimer])

  const getSubtaskDuration = (subtask) => {
    const accumulated = Number(subtask.totalDuration) || 0
    if (subtask.status !== 'RUNNING' || !timerNow) return accumulated
    const activeSession = subtask.sessions?.at(-1)
    const startedAt = activeSession ? Date.parse(activeSession.startedAt) : NaN
    if (!Number.isFinite(startedAt)) return accumulated
    return accumulated + Math.max(0, Math.floor((timerNow - startedAt) / 1000))
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
  const handleChange = ({ target }) => {
    if (target.value === '__create_customer__') {
      setQuickCreateCustomerOpen(true)
      return
    }
    setTask({ ...task, [target.name]: target.value })
  }
  const handleCustomerCreated = (createdCustomer) => {
    setCustomers((current) => [...current, createdCustomer])
    setTask((current) => ({ ...current, customerId: createdCustomer.id }))
  }

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
    setSubtaskType(subtaskTypes[0]?.value || '')
    setSubtaskNotes('')
    setSubtaskStartDate(localDateTime(nextMinute()))
    setSubtaskDueDate(selectedTaskItem.dueDate || '')
    setSubtaskDialogOpen(true)
  }

  const handleAddSubtask = async (event) => {
    event.preventDefault()
    const selectedType = subtaskTypes.find((option) => option.value === subtaskType)
    if ((subtaskRequired.includes('type') && !selectedType) || !subtaskStartDate || !subtaskDueDate || !selectedTask) return
    try {
      await updateTask(selectedTask.id, {
        subtasks: [...(selectedTask.subtasks || []), {
          type: selectedType?.value || null,
          title: selectedType?.label || '',
          notes: subtaskNotes.trim(),
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Button startIcon={isAdvancedSearchOpen ? <ExpandLess /> : <ExpandMore />} onClick={() => setIsAdvancedSearchOpen((openState) => !openState)}>{isAdvancedSearchOpen ? 'סגירת חיפוש מתקדם' : 'חיפוש מתקדם'}</Button>
          <Typography variant="h6">חיפוש וסינון משימות</Typography>
        </Stack>
        <TextField fullWidth label="חיפוש בכל השדות" placeholder="כותרת, לקוח, הערות..." value={filters.text} onChange={(event) => updateFilter('text', event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
        {isAdvancedSearchOpen && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1, mt: 1.5 }}>
          <TextField select label="לקוח" value={filters.customerId} onChange={(event) => updateFilter('customerId', event.target.value)}><MenuItem value="">כל הלקוחות</MenuItem>{availableCustomers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}</TextField>
          <TextField select label="עדיפות" value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)}><MenuItem value="">כל העדיפויות</MenuItem>{taskPriorities.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
          <TextField select label="סטטוס" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><MenuItem value="">כל הסטטוסים</MenuItem>{taskStatuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
          <TextField label="מתאריך" type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="עד תאריך" type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} InputLabelProps={{ shrink: true }} />
          <Button startIcon={<Clear />} onClick={clearFilters} disabled={!Object.values(filters).some(Boolean)}>ניקוי מסננים</Button>
        </Box>}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>נמצאו {filteredTasks.length} משימות</Typography>
      </Paper>
      <Stack spacing={2} sx={{ mb: 4 }}>
        {filteredTasks.map((item) => (
          <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight="bold">{item.title || 'ללא כותרת'}</Typography>
              <Typography variant="body2" color="text.secondary">לקוח: {customers.find((customer) => customer.id === item.customerId)?.fullName || 'ללא'}</Typography>
              <Typography variant="body2" color="text.secondary">עדיפות: {taskPriorities.find((option) => option.value === item.priority)?.label || item.priority} | סטטוס: {taskStatuses.find((option) => option.value === item.status)?.label || item.status}</Typography>
              <Typography variant="body2" color="text.secondary">תאריך יעד: {formatDateTime(item.dueDate)} | נמחקה: {item.isDeleted ? 'כן' : 'לא'}</Typography>
              <Typography variant="body2" color="text.secondary">הערות: {item.notes || 'ללא'}</Typography>
              <Stack spacing={0.25} sx={{ mt: 1 }}>
                {(item.subtasks || []).map((subtask, subtaskIndex) => (
                  <Box key={`${item.id}-subtask-${subtaskIndex}`} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox size="small" checked={Boolean(subtask.completed)} onChange={() => handleToggleSubtask(item, subtaskIndex)} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ textDecoration: subtask.completed ? 'line-through' : 'none' }}>{subtaskTypes.find((option) => option.value === subtask.type)?.label || subtask.title} | התחלה: {formatDateTime(subtask.startDate)} | סיום: {formatDateTime(subtask.dueDate)}</Typography>
                      {subtask.notes && <Typography variant="caption" color="text.secondary">הערה: {subtask.notes}</Typography>}
                      {includeSubtaskTimers && <Typography variant="caption" color="text.secondary">טיימר: {{ PAUSED: 'מושהה', RUNNING: 'פעיל', COMPLETED: 'הושלם' }[subtask.status] || 'מושהה'} | זמן כולל: {formatDuration(getSubtaskDuration(subtask))}</Typography>}
                    </Box>
                    {includeSubtaskTimers && <Box>
                      {subtask.status !== 'RUNNING' && subtask.status !== 'COMPLETED' && <IconButton size="small" color="success" aria-label={subtask.status === 'PAUSED' && subtask.sessions?.length ? 'המשך טיימר' : 'הפעל טיימר'} onClick={() => handleSubtaskTimer(item, subtaskIndex, 'start')}><PlayArrow /></IconButton>}
                      {subtask.status === 'RUNNING' && <IconButton size="small" color="warning" aria-label="השהה טיימר" onClick={() => handleSubtaskTimer(item, subtaskIndex, 'pause')}><Pause /></IconButton>}
                      {subtask.status !== 'COMPLETED' && <IconButton size="small" color="error" aria-label="סיים טיימר" onClick={() => handleSubtaskTimer(item, subtaskIndex, 'complete')}><Stop /></IconButton>}
                    </Box>}
                  </Box>
                ))}
                <Typography variant="body2" color="text.secondary">משימות משנה: {(item.subtasks || []).length}</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => openAddSubtask(item)} disabled={item.status === 'COMPLETED'} sx={{ alignSelf: 'flex-start' }}>הוספת משימת משנה</Button>
              </Stack>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}><IconButton color="primary" aria-label="עריכת משימה" onClick={() => openEdit(item)}><Edit /></IconButton><IconButton color="error" aria-label="מחיקת משימה" onClick={() => handleDelete(item.id)}><Delete /></IconButton></Box>
          </Paper>
        ))}
      </Stack>
      <Fab color="primary" aria-label="הוספת משימה" startIcon={<Add />} onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}>הוספת משימה</Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'עריכת משימה' : 'הוספת משימה'}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField select name="customerId" label="לקוח" value={task.customerId} onChange={handleChange} required={taskRequired.includes('customerId')}>
              <MenuItem value="">ללא לקוח</MenuItem>
              {availableCustomers.map((item) => <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>)}
              <QuickCreateCustomerOption onClick={() => setQuickCreateCustomerOpen(true)} />
            </TextField>
            <TextField name="title" label="כותרת" value={task.title} onChange={handleChange} required={taskTitleRequired} />
            <TextField select name="priority" label="עדיפות" value={task.priority} onChange={handleChange}>{taskPriorities.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
            <TextField select name="status" label="סטטוס" value={task.status} onChange={handleChange}>{taskStatuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>
            <TextField name="dueDate" type="datetime-local" label="תאריך יעד" value={task.dueDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
            <TextField name="notes" label="הערות" value={task.notes || ''} onChange={handleChange} multiline rows={3} required={taskRequired.includes('notes')} />
          </DialogContent>
          <DialogActions><Button onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" variant="contained">שמירה</Button></DialogActions>
        </Box>
      </Dialog>
      <QuickCreateCustomer open={quickCreateCustomerOpen} onClose={() => setQuickCreateCustomerOpen(false)} onCreated={handleCustomerCreated} picklists={picklists} user={user} />
      <Dialog open={subtaskDialogOpen} onClose={() => setSubtaskDialogOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleAddSubtask}>
          <DialogTitle>הוספת משימת משנה</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField autoFocus fullWidth select name="subtaskType" label="סוג משימה" value={subtaskType} onChange={(event) => setSubtaskType(event.target.value)} required={subtaskRequired.includes('type')}>
              {!subtaskRequired.includes('type') && <MenuItem value="">ללא סוג</MenuItem>}
              {subtaskTypes.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField fullWidth name="subtaskNotes" label="הערה" value={subtaskNotes} onChange={(event) => setSubtaskNotes(event.target.value)} multiline minRows={2} maxRows={5} required={subtaskRequired.includes('notes')} sx={{ mt: 2 }} />
            <TextField fullWidth name="subtaskStartDate" type="datetime-local" label="תאריך התחלה" value={subtaskStartDate} onChange={(event) => setSubtaskStartDate(event.target.value)} inputProps={{ min: localDateTime(nextMinute()), max: selectedTask?.dueDate || undefined }} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} />
            <TextField fullWidth name="subtaskDueDate" type="datetime-local" label="תאריך סיום" value={subtaskDueDate} onChange={(event) => setSubtaskDueDate(event.target.value)} inputProps={{ min: subtaskStartDate || localDateTime(nextMinute()), max: selectedTask?.dueDate || undefined }} InputLabelProps={{ shrink: true }} required sx={{ mt: 2 }} />
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