import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { incidentsApi } from '../services/api';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  plot: {
    id: number;
    name: string;
  };
  reported_by: {
    id: number;
    username: string;
  };
  incident_date: string;
  resolved: boolean;
  plot_id?: string;
}

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState<Incident & { plot_id?: string }>({
    id: 0,
    title: '',
    description: '',
    severity: 'low',
    plot: { id: 0, name: '' },
    reported_by: { id: 0, username: '' },
    incident_date: '',
    resolved: false,
  });
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('http://localhost:8000/api/incidents/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Try to refresh token
        const refreshResponse = await fetch('http://localhost:8000/api/auth/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: localStorage.getItem('refresh_token')
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('access_token', refreshData.access);
          // Retry the original request with new token
          return fetchIncidents();
        } else {
          throw new Error('Token expired and refresh failed');
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }
      
      const data = await response.json();
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('http://localhost:8000/api/incidents/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newIncident,
          reported_by: user.id,
          incident_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.status === 401) {
        // Try to refresh token
        const refreshResponse = await fetch('http://localhost:8000/api/auth/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: localStorage.getItem('refresh_token')
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('access_token', refreshData.access);
          // Retry the original request with new token
          return handleSubmit();
        } else {
          throw new Error('Token expired and refresh failed');
        }
      }

      if (!response.ok) {
        throw new Error('Failed to create incident');
      }
      
      setOpen(false);
      setNewIncident({
        id: 0,
        title: '',
        description: '',
        severity: 'low',
        plot: { id: 0, name: '' },
        reported_by: { id: 0, username: '' },
        incident_date: '',
        resolved: false,
        plot_id: '',
      });
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const incidentData = {
        id: newIncident.id,
        title: newIncident.title,
        description: newIncident.description,
        severity: newIncident.severity,
        plot: newIncident.plot_id ? parseInt(newIncident.plot_id) : 0,
        reported_by: user.id,
        incident_date: new Date().toISOString().split('T')[0],
        resolved: newIncident.resolved,
      };
      
      await incidentsApi.update(newIncident.id.toString(), incidentData);
      setOpen(false);
      setEditing(false);
      setNewIncident({
        id: 0,
        title: '',
        description: '',
        severity: 'low',
        plot: { id: 0, name: '' },
        reported_by: { id: 0, username: '' },
        incident_date: '',
        resolved: false,
        plot_id: '',
      });
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this incident?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await incidentsApi.delete(id);
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (incident: Incident) => {
    setNewIncident({
      ...incident,
      plot_id: incident.plot.id.toString(),
      severity: incident.severity as 'low' | 'medium' | 'high',
      id: incident.id,
      plot: incident.plot,
      reported_by: incident.reported_by,
      incident_date: incident.incident_date,
      resolved: incident.resolved
    });
    setEditing(true);
    setOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Incidents
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(true)}
            >
              Add Incident
            </Button>
          </Box>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Plot</TableCell>
                    <TableCell>Reported By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>{incident.title}</TableCell>
                      <TableCell>{incident.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={incident.severity}
                          color={incident.severity === 'low' ? 'success' : incident.severity === 'medium' ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{incident.plot.name}</TableCell>
                      <TableCell>{incident.reported_by.username}</TableCell>
                      <TableCell>{new Date(incident.incident_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={incident.resolved ? 'Resolved' : 'Open'}
                          color={incident.resolved ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(incident)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(incident.id.toString())}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Edit Incident' : 'New Incident'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={newIncident.title}
              onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={newIncident.description}
              onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            />
            <TextField
              select
              fullWidth
              label="Severity"
              value={newIncident.severity}
              onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as 'low' | 'medium' | 'high' })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Plot ID"
              value={newIncident.plot_id}
              onChange={(e) => setNewIncident({ ...newIncident, plot_id: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => editing ? handleUpdate() : handleSubmit()}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Incidents;