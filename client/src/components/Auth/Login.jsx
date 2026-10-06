import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Box, Button, Card, CardContent, Container, Tab, Tabs, TextField, Typography } from "@mui/material"
import { loginUser, registerUser } from "../../api"

const Login = ({ onLogin }) => {
  console.log("API BASE URL:", import.meta.env.VITE_API_URL)
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
        const response = await registerUser(form)
        console.log("REGISTER RESPONSE:", response)
        setError("החשבון נוצר בהצלחה. עכשיו באפשרותך להתחבר.")
        setIsRegister(false)
        setForm((prev) => ({ ...prev, businessName: "", password: "", confirmPassword: "", email: "" }))
        return
      }

      const response = await loginUser(form)
      console.log("LOGIN RESPONSE:", response)
      onLogin(response)
      navigate("/")
    } catch (error) {
      console.log("API ERROR:", error)
      console.log("ERROR RESPONSE:", error?.response)
      setError(error?.response?.data?.error || "אירעה שגיאה. נסה שוב.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Card elevation={1} sx={{ width: "100%" }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
            מנהל העסק
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>ניהול העסק שלך</Typography>

          <Tabs
            value={isRegister ? 1 : 0}
            onChange={(_, value) => {
              setIsRegister(value === 1)
              setError("")
            }}
            sx={{ mb: 3 }}
          >
            <Tab label="התחברות" />
            <Tab label="הרשמה" />
          </Tabs>

          {error && <Alert severity={error.includes("החשבון נוצר") ? "success" : "error"} sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
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
              {isSubmitting ? "מתחבר..." : isRegister ? "יצירת חשבון" : "התחברות"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Login