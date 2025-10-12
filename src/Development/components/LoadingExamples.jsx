import React, { useState } from 'react';
import { useLoading } from '../hooks/useLoading.js';
import LoadingButton from './ui/LoadingButton.jsx';
import { CompactLoader, CardLoader, TableRowLoader } from './LoadingStates.jsx';

const LoadingExamples = () => {
  const { withLoading, startLoading, stopLoading, isKeyLoading } = useLoading();
  const [data, setData] = useState(null);

  // Simulate API calls with different loading states
  const simulateApiCall = async (delay = 2000) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return { message: 'Data loaded successfully!' };
  };

  const handleDataLoading = async () => {
    const result = await withLoading(
      'data-fetch',
      () => simulateApiCall(3000),
      'DATA_LOADING',
      'overlay'
    );
    setData(result);
  };

  const handleBookingProcessing = async () => {
    await withLoading(
      'booking-process',
      () => simulateApiCall(4000),
      'BOOKING_LOADING',
      'overlay'
    );
  };

  const handleReportGeneration = async () => {
    await withLoading(
      'report-generate',
      () => simulateApiCall(5000),
      'REPORT_LOADING',
      'overlay'
    );
  };

  const handleRoomOperations = async () => {
    await withLoading(
      'room-operations',
      () => simulateApiCall(2500),
      'ROOM_LOADING',
      'overlay'
    );
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Hotel Management Loading Examples</h1>
      
      {/* Button Examples */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-700">Loading Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <LoadingButton
            loading={isKeyLoading('data-fetch')}
            onClick={handleDataLoading}
            variant="primary"
          >
            Load Guest Data
          </LoadingButton>
          
          <LoadingButton
            loading={isKeyLoading('booking-process')}
            onClick={handleBookingProcessing}
            variant="success"
          >
            Process Booking
          </LoadingButton>
          
          <LoadingButton
            loading={isKeyLoading('report-generate')}
            onClick={handleReportGeneration}
            variant="warning"
          >
            Generate Report
          </LoadingButton>
          
          <LoadingButton
            loading={isKeyLoading('room-operations')}
            onClick={handleRoomOperations}
            variant="outline"
          >
            Manage Rooms
          </LoadingButton>
        </div>
      </div>

      {/* Compact Loader Example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-700">Compact Loader</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <CompactLoader message="Loading room availability..." />
        </div>
      </div>

      {/* Card Loader Example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-700">Card Loader</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardLoader />
          <CardLoader />
          <CardLoader />
        </div>
      </div>

      {/* Table Loader Example */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-700">Table Loader</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <TableRowLoader columns={4} />
              <TableRowLoader columns={4} />
              <TableRowLoader columns={4} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Display */}
      {data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-800">Success!</h3>
          <p className="text-green-700">{data.message}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingExamples;
