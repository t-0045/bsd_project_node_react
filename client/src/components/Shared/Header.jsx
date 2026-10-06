import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"

// יבואי MUI
import { AccountCircle, Email, Person, Settings } from "@mui/icons-material"
import { AppBar, Avatar, Box, Button, Container, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Typography } from "@mui/material"
import { logoutUser } from "../../../../client/src/api"

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null)

  const closeProfileMenu = () => setProfileMenuAnchor(null)

  // עיצוב אחיד לכפתורי הניווט כולל מצב Active
  const navButtonStyles = {
    color: 'white',
    textTransform: 'capitalize',
    fontSize: '1rem',
    px: 2,
    py: 1,
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&.active': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderBottom: '3px solid white',
      fontWeight: 'bold',
    }
  }

  const handleLogout = async () => {
    closeProfileMenu()
    try {
      await logoutUser()
    } finally {
      onLogout()
      navigate('/login')
    }
  }

  return (
    <AppBar position="sticky" elevation={2}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: '.1rem' }}>
            מנהל העסק
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button component={NavLink} to="/" sx={navButtonStyles}>ראשי</Button>
            <Button component={NavLink} to="/customers" sx={navButtonStyles}>לקוחות</Button>
            <Button component={NavLink} to="/tasks" sx={navButtonStyles}>משימות</Button>
            <Button component={NavLink} to="/appointments" sx={navButtonStyles}>פגישות</Button>
            <IconButton
              color="inherit"
              aria-label="פתיחת הגדרות משתמש"
              aria-controls={profileMenuAnchor ? 'profile-settings-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(profileMenuAnchor)}
              onClick={(event) => setProfileMenuAnchor(event.currentTarget)}
              sx={{ p: 0.5, mr: 1 }}
            >
              <Avatar
                src={user?.profileImage || user?.avatarUrl || user?.photoUrl || undefined}
                alt={user?.businessName || 'פרופיל משתמש'}
                sx={{ width: 38, height: 38, bgcolor: 'white', color: 'primary.main' }}
              >
                <AccountCircle />
              </Avatar>
            </IconButton>
            <Menu
              id="profile-settings-menu"
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={closeProfileMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem component={NavLink} to="/settings" onClick={closeProfileMenu}>
                <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                <ListItemText primary="הגדרות משתמש" secondary={user?.email} />
              </MenuItem>
              <Divider />
              <MenuItem disabled>
                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                <ListItemText primary="פרטי המשתמש" secondary={user?.email || 'לא הוגדר אימייל'} />
              </MenuItem>
              <MenuItem disabled>
                <ListItemIcon><Email fontSize="small" /></ListItemIcon>
                <ListItemText primary="אימייל" secondary={user?.email || 'לא הוגדר אימייל'} />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>התנתקות</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header