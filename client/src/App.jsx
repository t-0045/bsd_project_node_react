import { useEffect, useState } from "react"
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom"
import Layout from './components/Shared/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Login from './components/Auth/Login'
import VerifyEmail from './components/Auth/VerifyEmail'
import CustomersList from './components/Customer/CustomersList'
import TasksList from './components/Task/TasksList'
import AppointmentsList from './components/Appointment/AppointmentsList'
import SettingsPage from './components/Shared/SettingsPage'
import { getCurrentUser, getPicklists } from './api'
import defaultPicklists from './picklists'

const App = () => {
  const [user, setUser] = useState(null)
  const [picklists, setPicklists] = useState(defaultPicklists)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      setIsLoading(false)
      return
    }

    getCurrentUser()
      .then(async (currentUser) => {
        const currentPicklists = await getPicklists().catch(() => defaultPicklists)
        setUser(currentUser)
        setPicklists(currentPicklists)
      })
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return null

  return (
    <Router>
        <Routes>
          <Route path='/login' element={<Login onLogin={async (currentUser) => {
            const currentPicklists = await getPicklists().catch(() => defaultPicklists)
            setPicklists(currentPicklists)
            setUser(currentUser)
          }} />} />
          <Route path='/verify-email' element={<VerifyEmail />} />
          <Route
            path='/'
            element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to='/login' replace />}
          >
            <Route index element={<Dashboard user={user} picklists={picklists} />} />
            <Route path='customers' element={<CustomersList user={user} picklists={picklists} />} />
            <Route path='tasks' element={<TasksList user={user} picklists={picklists} />} />
            <Route path='appointments' element={<AppointmentsList user={user} picklists={picklists} />} />
            <Route path='settings' element={<SettingsPage user={user} onUserUpdate={setUser} picklists={picklists} onPicklistsUpdate={setPicklists} />} />
          </Route>
          <Route path='*' element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
    </Router>
  )
}

export default App