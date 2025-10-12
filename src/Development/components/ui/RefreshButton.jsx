import React from 'react';
import { Button } from './button.js';
import { RefreshCw } from 'lucide-react';

const RefreshButton = ({ 
  onRefresh, 
  loading = false, 
  disabled = false, 
  className = "",
  size = "default",
  variant = "outline"
}) => {
  return (
    <Button
      onClick={onRefresh}
      disabled={disabled || loading}
      className={`flex items-center gap-2 ${className}`}
      size={size}
      variant={variant}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
};

export default RefreshButton;
