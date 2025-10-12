import { useLoading } from '../hooks/useLoading.js';

// Higher-order function to wrap API calls with loading states
export const withLoadingState = (apiFunction, loadingKey, loadingType = 'DATA_LOADING', variant = 'overlay') => {
  return async (...args) => {
    const { withLoading } = useLoading();
    return await withLoading(loadingKey, () => apiFunction(...args), loadingType, variant);
  };
};

// Utility to create loading-enhanced API functions
export const createLoadingApi = (apiFunctions, loadingTypes = {}) => {
  const enhancedFunctions = {};
  
  Object.keys(apiFunctions).forEach(key => {
    const originalFunction = apiFunctions[key];
    const loadingType = loadingTypes[key] || 'DATA_LOADING';
    
    enhancedFunctions[key] = async (...args) => {
      const { withLoading } = useLoading();
      return await withLoading(
        `api-${key}`,
        () => originalFunction(...args),
        loadingType,
        'overlay'
      );
    };
  });
  
  return enhancedFunctions;
};

// Predefined loading types for common hotel operations
export const HOTEL_LOADING_TYPES = {
  // Room operations
  fetchRooms: 'ROOM_LOADING',
  updateRoom: 'ROOM_LOADING',
  createRoom: 'ROOM_LOADING',
  deleteRoom: 'ROOM_LOADING',
  
  // Booking operations
  fetchBookings: 'BOOKING_LOADING',
  createBooking: 'BOOKING_LOADING',
  updateBooking: 'BOOKING_LOADING',
  cancelBooking: 'BOOKING_LOADING',
  checkIn: 'BOOKING_LOADING',
  checkOut: 'BOOKING_LOADING',
  
  // Guest operations
  fetchGuests: 'DATA_LOADING',
  updateGuest: 'DATA_LOADING',
  createGuest: 'DATA_LOADING',
  
  // Report operations
  fetchReports: 'REPORT_LOADING',
  generateReport: 'REPORT_LOADING',
  fetchReportByDate: 'REPORT_LOADING',
  
  // General data operations
  fetchData: 'DATA_LOADING',
  updateData: 'DATA_LOADING',
  deleteData: 'DATA_LOADING',
  
  // Form submissions
  submitForm: 'SUBMITTING',
  saveSettings: 'SUBMITTING',
  updateSettings: 'SUBMITTING',
};

// Hook to easily add loading to existing functions
export const useLoadingApi = () => {
  const { withLoading, startLoading, stopLoading, isKeyLoading } = useLoading();
  
  const wrapApiCall = (key, apiFunction, type = 'DATA_LOADING', variant = 'overlay') => {
    return async (...args) => {
      return await withLoading(key, () => apiFunction(...args), type, variant);
    };
  };
  
  const wrapApiCallWithType = (key, apiFunction, type = 'DATA_LOADING') => {
    return wrapApiCall(key, apiFunction, type, 'overlay');
  };
  
  return {
    wrapApiCall,
    wrapApiCallWithType,
    startLoading,
    stopLoading,
    isKeyLoading,
    withLoading,
  };
};

export default {
  withLoadingState,
  createLoadingApi,
  HOTEL_LOADING_TYPES,
  useLoadingApi,
};
