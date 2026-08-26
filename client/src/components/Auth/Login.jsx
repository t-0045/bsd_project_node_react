import { useState } from "react"
import { useNavigate } from "react-router-dom"

// יבואי MUI
import { Alert, Box, Button, Card, CardContent, Container, Tab, Tabs, TextField, Typography } from "@mui/material"
import { loginUser, registerUser } from "../../../../client/src/api"

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', businessName: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = ({ target }) => setForm({ ...form, [target.name]: target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (isRegister) {
        await registerUser(form)
        setError('החשבון נוצר. בדוק את האימייל שלך ואמת את הכתובת לפני ההתחברות.')
        setIsRegister(false)
        return
      }
      const authenticatedUser = await loginUser(form)
      onLogin(authenticatedUser)
      navigate('/')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'אירעה שגיאה. נסה שוב.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Card elevation={1} sx={{ width: '100%' }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
            מנהל העסק
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>ניהול העסק שלך</Typography>
          <Tabs value={isRegister ? 1 : 0} onChange={(_, value) => { setIsRegister(value === 1); setError('') }} sx={{ mb: 3 }}>
            <Tab label="התחברות" />
            <Tab label="הרשמה" />
          </Tabs>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            {isRegister && <TextField name="businessName" label="שם העסק" value={form.businessName} onChange={handleChange} required />}
            <TextField name="email" type="email" label="אימייל" value={form.email} onChange={handleChange} required />
            <TextField name="password" type="password" label="סיסמה" value={form.password} onChange={handleChange} required />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'מתחבר...' : isRegister ? 'יצירת חשבון' : 'התחברות'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Login