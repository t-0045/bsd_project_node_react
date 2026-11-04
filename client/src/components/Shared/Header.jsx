import { NavLink, useNavigate } from "react-router-dom"
import { logoutUser } from "../../../../client/src/api"
import defaultAvatar from "../../assets/default-avatar.svg"

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const handleLogout = async () => {
    try {
      await logoutUser()
    } finally {
      onLogout()
      navigate('/login')
    }
  }

  return (
    <header className="app-header">
      <NavLink className="app-brand" to="/">manager app</NavLink>
      <nav>
        <NavLink to="/customers">לקוחות</NavLink>
        <NavLink to="/tasks">משימות</NavLink>
        <NavLink to="/appointments">פגישות</NavLink>
      </nav>
      <details className="profile-menu">
        <summary aria-label="פתיחת הגדרות משתמש" onClick={() => navigate('/settings')}>
          <img src={user?.profileImage || user?.avatarUrl || user?.photoUrl || defaultAvatar} alt="תמונת פרופיל" />
          <span className="profile-business-name">{user?.businessName || 'שם העסק'}</span>
        </summary>
        <div className="profile-menu-panel">
          <p>{user?.email || 'לא הוגדר אימייל'}</p>
          <NavLink to="/settings">הגדרות משתמש</NavLink>
          <button type="button" onClick={handleLogout}>התנתקות</button>
        </div>
      </details>
    </header>
  )
}

export default Header