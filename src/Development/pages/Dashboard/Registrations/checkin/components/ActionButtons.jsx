import { Button } from "../../../../../components/ui/button.js";
import { Hotel } from "lucide-react";

const ActionButtons = ({
  loading,
  isSubmitting,
  hasValidationErrors,
  isFormValid,
  selectedBooking,
  handleCheckIn,
  handleClearSelection,
}) => {
  return (
    <div className="flex justify-end space-x-4 pt-6 border-t">
      {selectedBooking && (
        <Button
          variant="outline"
          onClick={handleClearSelection}
          disabled={loading}
        >
          Clear Selection
        </Button>
      )}
      
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCheckIn(e);
        }}
        className="bg-green-600 hover:bg-green-700 text-white cursor-pointer transition-colors"
        disabled={
          loading ||
          isSubmitting
        }
        type="button"
      >
        {loading || isSubmitting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center">
            <Hotel className="w-4 h-4 mr-2" />
            {selectedBooking
              ? "Complete Check-In"
              : "Check-In Guest"}
          </div>
        )}
      </Button>
    </div>
  );
};

export default ActionButtons; 