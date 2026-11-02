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
        height: '100vh',
        height: '100dvh',
        overflow: 'hidden'
      }}
    >
      <Header user={user} onLogout={onLogout} />
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          flex: '1 1 0',
          minHeight: 0,
          overflow: 'hidden',
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