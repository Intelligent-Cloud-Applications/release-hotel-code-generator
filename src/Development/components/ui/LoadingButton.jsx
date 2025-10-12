import React from 'react';
import { InlineLoader } from '../LoadingStates.jsx';

const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false, 
  className = "", 
  variant = "primary",
  size = "md",
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    warning: "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="mr-2">
          <InlineLoader size="sm" />
        </span>
      )}
      {children}
    </button>
  );
};

export default LoadingButton;
