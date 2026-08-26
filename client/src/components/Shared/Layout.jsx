import { Outlet } from "react-router-dom"

// יבואי MUI
import { Box, Container } from "@mui/material"
import Header from "./Header"

const Layout = ({ user, onLogout }) => {
  return (
    <Box
      className="page"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default'
      }}
    >
      <Header user={user} onLogout={onLogout} />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: 4,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Outlet />
      </Container>
    </Box>
  )
}

export default Layout