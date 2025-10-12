import React from 'react';
import HotelLoader from './HotelLoader.jsx';

// Different loading states for different contexts
export const LoadingStates = {
  // Initial app loading
  APP_LOADING: {
    message: "Initializing Hotel Management System",
    variant: "full"
  },
  
  // Institution data loading
  INSTITUTION_LOADING: {
    message: "Loading hotel configuration...",
    variant: "full"
  },
  
  // Authentication loading
  AUTH_LOADING: {
    message: "Verifying access credentials...",
    variant: "full"
  },
  
  // Data fetching
  DATA_LOADING: {
    message: "Retrieving data...",
    variant: "overlay"
  },
  
  // Form submission
  SUBMITTING: {
    message: "Processing request...",
    variant: "overlay"
  },
  
  // Room operations
  ROOM_LOADING: {
    message: "Updating room status...",
    variant: "overlay"
  },
  
  // Booking operations
  BOOKING_LOADING: {
    message: "Processing reservation...",
    variant: "overlay"
  },
  
  // Reports generation
  REPORT_LOADING: {
    message: "Generating report...",
    variant: "overlay"
  }
};

// Compact loader for smaller areas
export const CompactLoader = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-6">
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-slate-700 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-sm text-slate-600 font-medium">{message}</p>
    </div>
  </div>
);

// Overlay loader for modals and forms
export const OverlayLoader = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-40 flex items-center justify-center">
    <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 border border-gray-200">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-slate-700 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-r-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-slate-700 font-medium text-center">{message}</p>
      </div>
    </div>
  </div>
);

// Inline loader for buttons and small components
export const InlineLoader = ({ size = "sm" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-slate-700 rounded-full animate-spin`}></div>
  );
};

// Table row loader
export const TableRowLoader = ({ columns = 4 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </td>
    ))}
  </tr>
);

// Card loader
export const CardLoader = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

// Main loader component that handles different variants
export const GlobalLoader = ({ type = "APP_LOADING", variant = "full" }) => {
  const loadingState = LoadingStates[type] || LoadingStates.APP_LOADING;
  
  if (variant === "overlay") {
    return <OverlayLoader message={loadingState.message} />;
  }
  
  if (variant === "compact") {
    return <CompactLoader message={loadingState.message} />;
  }
  
  return <HotelLoader message={loadingState.message} />;
};

export default GlobalLoader;
