import { useEffect, useState } from "react"
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom"
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material"
import Layout from './components/Shared/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Login from './components/Auth/Login'
import VerifyEmail from './components/Auth/VerifyEmail'
import CustomersList from './components/Customer/CustomersList'
import TasksList from './components/Task/TasksList'
import AppointmentsList from './components/Appointment/AppointmentsList'
import SettingsPage from './components/Shared/SettingsPage'
import { getCurrentUser } from './api'

// יצירת ערכת נושא (Theme) נקייה ומודרנית
const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f4f6f8' },
  },
  typography: { fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif' },
})

const App = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      setIsLoading(false)
      return
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return null

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path='/login' element={<Login onLogin={setUser} />} />
          <Route path='/verify-email' element={<VerifyEmail />} />
          <Route
            path='/'
            element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to='/login' replace />}
          >
            <Route index element={<Dashboard user={user} />} />
            <Route path='customers' element={<CustomersList />} />
            <Route path='tasks' element={<TasksList user={user} />} />
            <Route path='appointments' element={<AppointmentsList />} />
            <Route path='settings' element={<SettingsPage user={user} onUserUpdate={setUser} />} />
          </Route>
          <Route path='*' element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App