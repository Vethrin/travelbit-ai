import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Grid, Paper, Chip, Autocomplete, Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const interestsOptions = [
  'Beaches', 'Mountains', 'City Tours', 'Museums', 
  'Adventure', 'Food & Dining', 'Shopping', 'History', 
  'Nature', 'Nightlife', 'Relaxation', 'Sports'
];

const budgetOptions = ['Budget', 'Mid-range', 'Luxury'];

const ItineraryForm = ({ onItineraryGenerated }) => {
  const [formData, setFormData] = useState({
    destination: '',
    startDate: null,
    endDate: null,
    travelers: 1,
    budget: 'Mid-range',
    interests: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/generate-itinerary', {
        destination: formData.destination,
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0],
        travelers: formData.travelers,
        budget: formData.budget,
        interests: formData.interests
      });
      
      onItineraryGenerated(response.data);
    } catch (err) {
      setError('Failed to generate itinerary. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Plan Your Perfect Trip
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, startDate: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, endDate: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  minDate={formData.startDate || new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Travelers"
                name="travelers"
                type="number"
                value={formData.travelers}
                onChange={handleChange}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={budgetOptions}
                value={formData.budget}
                onChange={(e, newValue) => setFormData(prev => ({ ...prev, budget: newValue }))}
                renderInput={(params) => (
                  <TextField {...params} label="Budget" fullWidth required />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={interestsOptions}
                value={formData.interests}
                onChange={(e, newValue) => setFormData(prev => ({ ...prev, interests: newValue }))}
                renderInput={(params) => (
                  <TextField {...params} label="Interests" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || !formData.startDate || !formData.endDate}
                >
                  {loading ? 'Generating...' : 'Generate Itinerary'}
                </Button>
              </Box>
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Typography color="error" align="center">
                  {error}
                </Typography>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ItineraryForm;