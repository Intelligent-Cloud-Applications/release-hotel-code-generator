import { createContext, useContext, useState } from 'react';
import { GlobalLoader, OverlayLoader } from '../components/LoadingStates.jsx';

const LoadingContext = createContext();

export const useLoadingContext = () => {
  return useContext(LoadingContext);
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = (key, isLoading, type = 'DATA_LOADING', variant = 'overlay') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { isLoading, type, variant }
    }));
  };

  const clearLoading = (key) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  };

  const isLoading = Object.values(loadingStates).some(state => state.isLoading);
  const currentLoadingState = Object.values(loadingStates).find(state => state.isLoading);

  const renderLoader = () => {
    if (!isLoading || !currentLoadingState) return null;

    const { type, variant } = currentLoadingState;

    if (variant === 'overlay') {
      return <OverlayLoader message={getLoadingMessage(type)} />;
    }

    return <GlobalLoader type={type} variant={variant} />;
  };

  const getLoadingMessage = (type) => {
    const messages = {
      'APP_LOADING': 'Welcome to our Hotel Management System',
      'INSTITUTION_LOADING': 'Loading hotel information...',
      'AUTH_LOADING': 'Authenticating your access...',
      'DATA_LOADING': 'Fetching your data...',
      'SUBMITTING': 'Processing your request...',
      'ROOM_LOADING': 'Managing room operations...',
      'BOOKING_LOADING': 'Processing your booking...',
      'REPORT_LOADING': 'Generating your report...',
    };
    return messages[type] || 'Loading...';
  };

  return (
    <LoadingContext.Provider
      value={{
        setLoading,
        clearLoading,
        isLoading,
        loadingStates,
      }}
    >
      {children}
      {renderLoader()}
    </LoadingContext.Provider>
  );
};
