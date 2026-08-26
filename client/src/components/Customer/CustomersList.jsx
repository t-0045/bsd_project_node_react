import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

// יבואי MUI
import { Add, AddTask, Delete, Edit, Search } from "@mui/icons-material"
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Fab, IconButton, InputAdornment, MenuItem, Paper, Stack,
  TextField, Typography
} from "@mui/material"
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from "../../api"

const emptyCustomer = { fullName: '', phone: '', email: '', status: 'LEAD', notes: '' }

const CustomersList = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [val, setVal] = useState("")
  const [customer, setCustomer] = useState(emptyCustomer)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCustomers = async () => {
    try {
      setCustomers(await getCustomers())
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadCustomers = async () => fetchCustomers()
    loadCustomers()
  }, [])

  const openAdd = () => {
    setCustomer(emptyCustomer)
    setEditingId(null)
    setOpen(true)
  }

  const openEdit = (selectedCustomer) => {
    setCustomer({ ...emptyCustomer, ...selectedCustomer })
    setEditingId(selectedCustomer.id)
    setOpen(true)
  }

  const handleChange = ({ target }) => setCustomer({ ...customer, [target.name]: target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingId) await updateCustomer(editingId, customer)
      else await createCustomer(customer)
      setOpen(false)
      fetchCustomers()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to save customer')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return
    await deleteCustomer(id)
    fetchCustomers()
  }

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">Customers</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        fullWidth
        placeholder="Search customers..."
        value={val}
        onChange={(event) => setVal(event.target.value)}
        sx={{ mb: 3, backgroundColor: 'background.paper' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
      />
      <Stack spacing={2} sx={{ mb: 4 }}>
        {customers.filter((item) => item.fullName.toLowerCase().includes(val.toLowerCase())).map((item) => (
          <Paper key={item.id} elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography fontWeight="bold">{item.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{item.email || item.phone || 'No contact details'} | {item.status}</Typography>
            </Box>
            <Box>
              {item.status === 'ACTIVE' && <IconButton color="success" aria-label={`Add task for ${item.fullName}`} onClick={() => navigate(`/tasks?customerId=${item.id}`)}><AddTask /></IconButton>}
              <IconButton color="primary" onClick={() => openEdit(item)}><Edit /></IconButton>
              <IconButton color="error" onClick={() => handleDelete(item.id)}><Delete /></IconButton>
            </Box>
          </Paper>
        ))}
      </Stack>
      <Fab color="primary" aria-label="add customer" onClick={openAdd} sx={{ position: 'fixed', bottom: 32, right: 32 }}><Add /></Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Edit customer' : 'Add customer'}</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField name="fullName" label="Full name" value={customer.fullName} onChange={handleChange} required />
            <TextField name="phone" label="Phone" value={customer.phone} onChange={handleChange} />
            <TextField name="email" type="email" label="Email" value={customer.email} onChange={handleChange} />
            <TextField select name="status" label="Status" value={customer.status} onChange={handleChange}>
              <MenuItem value="LEAD">Lead</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
            <TextField name="notes" label="Notes" multiline rows={3} value={customer.notes} onChange={handleChange} />
          </DialogContent>
          <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Save</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default CustomersList