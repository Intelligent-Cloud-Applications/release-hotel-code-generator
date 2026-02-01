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
    primary: "bg-gold-rich text-gold hover:opacity-90 focus:ring-gold",
    secondary: "bg-champagne text-black hover:brightness-95 focus:ring-gray-500",
    success: "bg-green-700 text-white hover:bg-green-800 focus:ring-green-500", // Keep semantic green but darker
    danger: "bg-red-700 text-white hover:bg-red-800 focus:ring-red-500", // Keep semantic red but darker
    warning: "bg-gold text-black hover:brightness-110 focus:ring-gold",
    outline: "border border-gold bg-transparent text-black hover:bg-champagne focus:ring-gold",
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
