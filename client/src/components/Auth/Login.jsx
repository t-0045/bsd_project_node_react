import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Box, Button, Card, CardContent, Tab, Tabs, TextField, Typography } from "../Shared/PrimeUI"
import { loginUser, registerUser } from "../../api"

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = `mannager app | ${isRegister ? "הרשמה" : "התחברות"}`
  }, [isRegister])

  const handleChange = ({ target }) => {
    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (isRegister && form.password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים")
      return
    }
    if (isRegister && form.password !== form.confirmPassword) {
      setError("אימות הסיסמה אינו תואם לסיסמה")
      return
    }

    setIsSubmitting(true)

    try {
      if (isRegister) {
        const user = await registerUser(form)
        await onLogin(user)
        navigate("/")
        return
      }

      const response = await loginUser(form)
      await onLogin(response)
      navigate("/")
    } catch (error) {
      setError(error?.response?.data?.error || "אירעה שגיאה. נסה שוב.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card" elevation={1}>
        <CardContent>
          <Typography variant="h4" component="h1" className="auth-title">
             mannager app
          </Typography>
          <Typography className="auth-subtitle">ניהול העסק שלך</Typography>

          <Tabs
            value={isRegister ? 1 : 0}
            onChange={(_, value) => {
              setIsRegister(value === 1)
              setError("")
            }}
          >
            <Tab label="התחברות" />
            <Tab label="הרשמה" />
          </Tabs>

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <TextField
                name="businessName"
                label="שם העסק"
                value={form.businessName}
                onChange={handleChange}
                required
              />
            )}
            <TextField name="email" type="email" label="אימייל" value={form.email} onChange={handleChange} required />
            <TextField name="password" type="password" label="סיסמה" value={form.password} onChange={handleChange} inputProps={isRegister ? { minLength: 8 } : undefined} required />
            {isRegister && (
              <TextField
                name="confirmPassword"
                type="password"
                label="אימות סיסמה"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            )}
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? isRegister ? "יוצר חשבון..." : "מתחבר..." : isRegister ? "יצירת חשבון" : "התחברות"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </main>
  )
}

export default Login