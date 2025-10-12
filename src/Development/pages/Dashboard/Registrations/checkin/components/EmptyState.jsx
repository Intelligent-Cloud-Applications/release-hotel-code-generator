import { Button } from "../../../../../components/ui/button.js";
import { Hotel, Search } from "lucide-react";

const EmptyState = ({ handleDialogOpen, setIsModalOpen }) => {
  return (
    <div className="text-center py-12">
      <Hotel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        No Booking Selected
      </h3>
      <p className="text-gray-600 mb-4">
        Please select a reserved booking to proceed with check-in
      </p>
      <Button
        onClick={() => {
          handleDialogOpen();
          setIsModalOpen(true);
        }}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Search className="w-4 h-4 mr-2" />
        Select Booking
      </Button>
    </div>
  );
};

export default EmptyState; 