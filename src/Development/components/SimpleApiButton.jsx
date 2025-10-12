import React, { useState } from 'react';
import { Button } from './ui/button.js';
import { toast } from 'sonner';

const SimpleApiButton = ({ 
  onClick, 
  children = "Call API", 
  variant = "default",
  size = "default",
  className = "",
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!onClick) return;
    
    setLoading(true);
    try {
      await onClick();
      toast.success('API call completed successfully!');
    } catch (error) {
      console.error('API call failed:', error);
      toast.error('API call failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default SimpleApiButton; 