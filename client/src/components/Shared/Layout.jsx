import { Outlet, useLocation } from "react-router-dom"

import { Box, Container } from "./PrimeUI"
import Header from "./Header"

const Layout = ({ user, onLogout }) => {
  const { pathname } = useLocation()

  return (
    <Box
      className="page"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh'
      }}
    >
      <Header user={user} onLogout={onLogout} />
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          flex: '1 1 0',
          minHeight: 0,
          py: 4,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div key={pathname} className="page-transition">
          <Outlet />
        </div>
      </Container>
    </Box>
  )
}

export default Layout