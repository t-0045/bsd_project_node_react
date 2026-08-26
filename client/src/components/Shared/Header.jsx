import { NavLink, useNavigate } from "react-router-dom"

// יבואי MUI
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material"
import { logoutUser } from "../../../../client/src/api"

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate()

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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography sx={{ display: { xs: 'none', md: 'block' }, alignSelf: 'center', mr: 1 }}>{user.businessName}</Typography>
            <Button component={NavLink} to="/" sx={navButtonStyles}>ראשי</Button>
            <Button component={NavLink} to="/customers" sx={navButtonStyles}>לקוחות</Button>
            <Button component={NavLink} to="/tasks" sx={navButtonStyles}>משימות</Button>
            <Button component={NavLink} to="/appointments" sx={navButtonStyles}>פגישות</Button>
            <Button color="inherit" onClick={handleLogout} sx={navButtonStyles}>התנתקות</Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header