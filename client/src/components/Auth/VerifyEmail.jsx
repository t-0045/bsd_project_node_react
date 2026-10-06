import { useState } from "react"
import { Alert, Box, Button, Container, TextField, Typography } from "../Shared/PrimeUI"

const VerifyEmail = () => {
  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('emailVerificationForm')) || { email: '', token: '' }
    } catch {
      return { email: '', token: '' }
    }
  })
  const [status, setStatus] = useState('idle')

  const updateForm = (nextForm) => {
    setForm(nextForm)
    sessionStorage.setItem('emailVerificationForm', JSON.stringify(nextForm))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')

    // אימות מייל מושבת
    sessionStorage.removeItem('emailVerificationForm')
    setStatus('success')
  }

  return (
    <Container sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>אימות אימייל</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>אימות האימייל הושבת זמנית</Typography>
      {status === 'success' && <Alert severity="success">האימייל לא נדרש יותר. אפשר להתחבר.</Alert>}
      {status !== 'success' && (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', display: 'grid', gap: 2 }}>
          <TextField label="אימייל" type="email" value={form.email} onChange={({ target }) => updateForm({ ...form, email: target.value })} required />
          <TextField label="קוד אימות" inputProps={{ maxLength: 6, inputMode: 'numeric' }} value={form.token} onChange={({ target }) => updateForm({ ...form, token: target.value.replace(/\D/g, '') })} required />
          <Button type="submit" variant="contained" disabled={status === 'loading'}>אימות</Button>
        </Box>
      )}
      <Typography sx={{ mt: 2 }} component="a" href="/login">חזרה להתחברות</Typography>
    </Container>
  )
}

export default VerifyEmail