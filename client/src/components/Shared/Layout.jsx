import { Outlet } from "react-router-dom"

import { Box, Container } from "./PrimeUI"
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