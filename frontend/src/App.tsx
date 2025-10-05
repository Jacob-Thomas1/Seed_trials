import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';

// Layout
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Seeds from './pages/Seeds';
import Plots from './pages/Plots';
import Trials from './pages/Trials';
import { Incidents } from './pages/Incidents';
import Login from './pages/Login';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green shade
    },
    secondary: {
      main: '#FFA000', // Amber shade
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (token: string) => {
    localStorage.setItem('access_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          
          <Route path="/" element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/seeds" element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Seeds />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/plots" element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Plots />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/incidents" element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Incidents />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/trials" element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Trials />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
