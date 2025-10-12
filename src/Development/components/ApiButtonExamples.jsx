import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import SimpleApiButton from './SimpleApiButton.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';

const ApiButtonExamples = () => {
  const { 
    fetchRooms, 
    fetchBookings, 
    fetchGuests, 
    processdayEnd,
    loading 
  } = useAppContext();

  // Example API call functions
  const handleFetchRooms = async () => {
    await fetchRooms();
  };

  const handleFetchBookings = async () => {
    await fetchBookings();
  };

  const handleFetchGuests = async () => {
    await fetchGuests();
  };

  const handleDayEnd = async () => {
    await processdayEnd({
      listData: {
        roomStatus: true,
        revenue: true,
        checkouts: true,
        reports: true
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">API Button Examples</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fetch Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleApiButton 
              onClick={handleFetchRooms}
              disabled={loading}
            >
              Get Rooms
            </SimpleApiButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fetch Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleApiButton 
              onClick={handleFetchBookings}
              disabled={loading}
            >
              Get Bookings
            </SimpleApiButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fetch Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleApiButton 
              onClick={handleFetchGuests}
              disabled={loading}
            >
              Get Guests
            </SimpleApiButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Process Day End</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleApiButton 
              onClick={handleDayEnd}
              disabled={loading}
              variant="destructive"
            >
              Close Day
            </SimpleApiButton>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Usage Examples:</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Basic usage:</strong> Just pass an async function to onClick</p>
          <p><strong>Loading state:</strong> Automatically handled with spinner</p>
          <p><strong>Error handling:</strong> Toast notifications for success/error</p>
          <p><strong>Customization:</strong> Supports all Button props (variant, size, className)</p>
        </div>
      </div>
    </div>
  );
};

export default ApiButtonExamples; 