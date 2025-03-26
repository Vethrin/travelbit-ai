import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Grid, Box, CircularProgress, Button, Card, CardMedia, CardContent, Chip } from '@mui/material';
import axios from 'axios';

const ItineraryResult = ({ itineraryData, onNewSearch }) => {
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    if (itineraryData?.destination) {
      fetchDestinationImages(itineraryData.destination);
    }
  }, [itineraryData]);

  const fetchDestinationImages = async (destination) => {
    setLoadingImages(true);
    try {
      const response = await axios.get('http://localhost:5000/get-destination-images', {
        params: { destination }
      });
      setImages(response.data.images);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  if (!itineraryData) {
    return null;
  }

  // Parse the AI-generated itinerary text into sections
  const parseItineraryText = (text) => {
    const sections = {
      flights: '',
      hotels: '',
      itinerary: [],
      tips: ''
    };
    
    // This is a simple parser - in a real app you'd want more robust parsing
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentSection = null;
    lines.forEach(line => {
      if (line.includes('Flight Options:')) {
        currentSection = 'flights';
      } else if (line.includes('Hotel Recommendations:')) {
        currentSection = 'hotels';
      } else if (line.includes('Daily Itinerary:')) {
        currentSection = 'itinerary';
      } else if (line.includes('Travel Tips:')) {
        currentSection = 'tips';
      } else if (currentSection === 'itinerary' && line.trim().startsWith('Day')) {
        sections.itinerary.push({
          day: line.trim(),
          activities: []
        });
      } else if (currentSection === 'itinerary' && sections.itinerary.length > 0) {
        const lastDay = sections.itinerary[sections.itinerary.length - 1];
        lastDay.activities.push(line.trim());
      } else if (currentSection) {
        if (currentSection === 'flights') {
          sections.flights += line + '\n';
        } else if (currentSection === 'hotels') {
          sections.hotels += line + '\n';
        } else if (currentSection === 'tips') {
          sections.tips += line + '\n';
        }
      }
    });
    
    return sections;
  };

  const parsedItinerary = parseItineraryText(itineraryData.itinerary);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        variant="outlined" 
        onClick={onNewSearch}
        sx={{ mb: 2 }}
      >
        Plan Another Trip
      </Button>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your {itineraryData.budget} Trip to {itineraryData.destination}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {itineraryData.dates} • {itineraryData.travelers} {itineraryData.travelers > 1 ? 'Travelers' : 'Traveler'}
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Flight Options
            </Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 3, whiteSpace: 'pre-line' }}>
              {parsedItinerary.flights || 'No flight information available'}
            </Paper>
            
            <Typography variant="h5" gutterBottom>
              Hotel Recommendations
            </Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 3, whiteSpace: 'pre-line' }}>
              {parsedItinerary.hotels || 'No hotel information available'}
            </Paper>
            
            <Typography variant="h5" gutterBottom>
              Daily Itinerary
            </Typography>
            {parsedItinerary.itinerary.map((day, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography 
                  variant="h6" 
                  onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                  sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {day.day}
                  <Chip 
                    label={expandedDay === index ? 'Collapse' : 'Expand'} 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Typography>
                
                {(expandedDay === index || expandedDay === null) && (
                  <Box sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                    {day.activities.join('\n')}
                  </Box>
                )}
              </Paper>
            ))}
            
            {parsedItinerary.tips && (
              <>
                <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                  Travel Tips
                </Typography>
                <Paper elevation={1} sx={{ p: 2, whiteSpace: 'pre-line' }}>
                  {parsedItinerary.tips}
                </Paper>
              </>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h5" gutterBottom>
              Destination Photos
            </Typography>
            
            {loadingImages ? (
              <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              images.map((img, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={img.url}
                    alt={img.description}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {img.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ItineraryResult;