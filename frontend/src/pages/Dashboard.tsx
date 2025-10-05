import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  seedsApi,
  plotsApi,
  trialsApi,
  incidentsApi,
} from '../services/api';

interface SummaryData {
  totalSeeds: number;
  totalPlots: number;
  totalTrials: number;
  recentIncidents: number;
  trialsByCrop: { seed__crop_name: string; count: number }[];
  trialsByPlot: { plot__location: string; count: number }[];
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<SummaryData>({
    totalSeeds: 0,
    totalPlots: 0,
    totalTrials: 0,
    recentIncidents: 0,
    trialsByCrop: [],
    trialsByPlot: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          seedsResponse,
          plotsResponse,
          trialsResponse,
          incidentsResponse,
        ] = await Promise.all([
          seedsApi.getAll(),
          plotsApi.getAll(),
          trialsApi.getSummary({}),
          incidentsApi.getSummary(),
        ]);

        setSummary({
          totalSeeds: seedsResponse.data.length,
          totalPlots: plotsResponse.data.length,
          totalTrials: trialsResponse.data.total_trials,
          recentIncidents: incidentsResponse.data.recent_incidents,
          trialsByCrop: trialsResponse.data.trials_by_crop,
          trialsByPlot: trialsResponse.data.trials_by_plot,
        });
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Seeds
            </Typography>
            <Typography variant="h4">{summary.totalSeeds}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Plots
            </Typography>
            <Typography variant="h4">{summary.totalPlots}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Trials
            </Typography>
            <Typography variant="h4">{summary.totalTrials}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Recent Incidents
            </Typography>
            <Typography variant="h4">{summary.recentIncidents}</Typography>
          </Paper>
        </Grid>

        {/* Trials by Crop */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Trials by Crop
            </Typography>
            {summary.trialsByCrop.map((item) => (
              <Box key={item.seed__crop_name} sx={{ mb: 1 }}>
                <Typography>
                  {item.seed__crop_name}: {item.count} trials
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Trials by Plot */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Trials by Plot
            </Typography>
            {summary.trialsByPlot.map((item) => (
              <Box key={item.plot__location} sx={{ mb: 1 }}>
                <Typography>
                  {item.plot__location}: {item.count} trials
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 