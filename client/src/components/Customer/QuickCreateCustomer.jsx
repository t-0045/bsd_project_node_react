import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '../Shared/PrimeUI'
import { createCustomer } from '../../api'

const emptyCustomer = { fullName: '', phone: '', email: '', status: 'LEAD', notes: '' }

export const QuickCreateCustomerOption = () => <MenuItem value="__create_customer__">יצירת לקוח חדש</MenuItem>

const QuickCreateCustomer = ({ open, onClose, onCreated, picklists, user }) => {
  const customerStatuses = picklists?.customerStatus || []
  const customerRequired = user?.requiredFields?.customer ?? ['fullName']
  const [customer, setCustomer] = useState(emptyCustomer)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const createdCustomer = await createCustomer(customer)
      onCreated(createdCustomer)
      setCustomer(emptyCustomer)
      onClose()
    } catch (requestError) {
      if (requestError.response?.data?.code === 'DUPLICATE_CUSTOMER_WARNING') {
        setDuplicateWarning({ customer, matches: requestError.response.data.matches || [] })
        return
      }
      setError(requestError.response?.data?.error || 'לא ניתן ליצור לקוח')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDuplicateCreate = async () => {
    if (!duplicateWarning) return
    setIsSaving(true)
    setError('')
    try {
      const createdCustomer = await createCustomer({ ...duplicateWarning.customer, allowDuplicate: true })
      setDuplicateWarning(null)
      onCreated(createdCustomer)
      setCustomer(emptyCustomer)
      onClose()
    } catch (requestError) {
      setDuplicateWarning(null)
      setError(requestError.response?.data?.error || 'לא ניתן ליצור לקוח')
    } finally {
      setIsSaving(false)
    }
  }

  const close = () => {
    if (isSaving) return
    onClose()
    setError('')
    setDuplicateWarning(null)
  }

  return <>
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>יצירת לקוח חדש</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField autoFocus name="fullName" label="שם מלא" value={customer.fullName} onChange={({ target }) => setCustomer({ ...customer, fullName: target.value })} required={customerRequired.includes('fullName')} />
          <TextField name="phone" label="טלפון" value={customer.phone} onChange={({ target }) => setCustomer({ ...customer, phone: target.value })} required={customerRequired.includes('phone')} />
          <TextField name="email" type="email" label="אימייל" value={customer.email} onChange={({ target }) => setCustomer({ ...customer, email: target.value })} required={customerRequired.includes('email')} />
          <TextField select name="status" label="סטטוס" value={customer.status} onChange={({ target }) => setCustomer({ ...customer, status: target.value })}>
            {customerStatuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </TextField>
          <TextField name="notes" label="הערות" value={customer.notes} onChange={({ target }) => setCustomer({ ...customer, notes: target.value })} multiline rows={2} required={customerRequired.includes('notes')} />
        </DialogContent>
        <DialogActions><Button onClick={close} disabled={isSaving}>ביטול</Button><Button type="submit" variant="contained" disabled={isSaving}>יצירת לקוח</Button></DialogActions>
      </Box>
    </Dialog>
    <Dialog open={Boolean(duplicateWarning)} onClose={() => setDuplicateWarning(null)} fullWidth maxWidth="xs">
      <DialogTitle>ייתכן שהלקוח כבר קיים</DialogTitle>
      <DialogContent>
        <Typography>נמצאו לקוחות עם מספר טלפון או אימייל זהים:</Typography>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {duplicateWarning?.matches.map((match) => (
            <Box key={match.id}>
              <Typography fontWeight="bold">{match.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{[match.phone, match.email].filter(Boolean).join(' | ')}</Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDuplicateWarning(null)} disabled={isSaving}>חזרה לעריכה</Button>
        <Button variant="contained" onClick={confirmDuplicateCreate} disabled={isSaving}>יצירה בכל זאת</Button>
      </DialogActions>
    </Dialog>
  </>
}

export default QuickCreateCustomer