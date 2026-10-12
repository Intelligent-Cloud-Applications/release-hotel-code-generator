import React from 'react';
import { Building2, Loader2 } from 'lucide-react';

const HotelLoader = ({ message = "Loading your hotel experience..." }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Main Loader Container */}
      <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md mx-auto px-6">
        {/* Hotel Logo/Icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Elegant Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-slate-700 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-r-blue-600 rounded-full animate-spin" style={{ 
            animationDirection: 'reverse', 
            animationDuration: '1.5s' 
          }}></div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <h3 className="text-lg font-medium text-slate-800">
            {message}
          </h3>
          <div className="flex space-x-1 justify-center">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-48 bg-gray-100 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-slate-700 to-blue-600 rounded-full" style={{ 
            animation: 'progress 2s ease-in-out infinite',
            width: '100%'
          }}></div>
        </div>

        {/* Hotel Name/System Name */}
        <div className="text-center">
          <p className="text-sm text-slate-500 font-medium">Hotel Management System</p>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default HotelLoader;
