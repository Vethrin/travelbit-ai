import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ItineraryForm from './components/ItineraryForm';
import ItineraryResult from './components/ItineraryResult';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [itinerary, setItinerary] = useState(null);

  const handleItineraryGenerated = (data) => {
    setItinerary({
      ...data,
      destination: itinerary?.destination || data.destination,
      dates: itinerary?.dates || `${data.start_date} to ${data.end_date}`,
      travelers: itinerary?.travelers || data.travelers,
      budget: itinerary?.budget || data.budget
    });
  };

  const handleNewSearch = () => {
    setItinerary(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!itinerary ? (
        <ItineraryForm onItineraryGenerated={handleItineraryGenerated} />
      ) : (
        <ItineraryResult itineraryData={itinerary} onNewSearch={handleNewSearch} />
      )}
    </ThemeProvider>
  );
}

export default App;