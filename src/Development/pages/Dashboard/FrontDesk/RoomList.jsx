import { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext.jsx";
import { Wifi, RefreshCw, AlertCircle, Loader2, Filter } from "lucide-react";

import VacantIcon from "../../../assets/Icons/vacant-svg.svg";
import ReservedIcon from "../../../assets/Icons/rederved-svg.svg";
import OccupiedIcon from "../../../assets/Icons/occupied-svg.svg";
import DirtyIcon from "../../../assets/Icons/dirty_svg.svg";
import MaintenanceIcon from "../../../assets/Icons/maintanance-svg.svg";
import { Button } from "../../../components/ui/button.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";

const RoomList = () => {
  const { rooms, fetchRooms, error } = useAppContext();
  const [pageLoading, setPageLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try { 
        console.log('RoomList: Starting to fetch rooms data...');
        setDataFetched(false);
        setInitialLoad(true);
        
        // Fetch rooms data
        await fetchRooms();
        
        console.log('RoomList: Rooms data fetched successfully');
        
        // Add a small delay to make skeleton loading visible (remove in production)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark data as fetched and initial load as complete
        setDataFetched(true);
        setInitialLoad(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setDataFetched(true);
        setInitialLoad(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setPageLoading(true);
      setDataFetched(false);
      setInitialLoad(true);
      
      await fetchRooms();
      
      setDataFetched(true);
      setInitialLoad(false);
      setPageLoading(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setDataFetched(true);
      setInitialLoad(false);
      setPageLoading(false);
    }
  };

  const getRoomStatus = (room) => {
    return room.status;
  };

  // Filter and sort rooms based on selected status and room number
  const filteredAndSortedRooms = rooms
    .filter((room) => {
      if (statusFilter === "all") return true;
      const currentStatus = getRoomStatus(room);
      return currentStatus === statusFilter;
    })
    .sort((a, b) => {
      // Sort by room number (treating as numbers for proper numeric sorting)
      return parseInt(a.room_number) - parseInt(b.room_number);
    });

  // Get room counts for each status
  const getRoomCounts = () => {
    const counts = {
      all: rooms.length,
      Vacant: 0,
      Reserved: 0,
      Occupied: 0,
      Dirty: 0,
      "Under Maintenance": 0,
    };

    rooms.forEach((room) => {
      const status = getRoomStatus(room);
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    return counts;
  };

  const roomCounts = getRoomCounts();

  return (
    <>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Rooms</h2>
          
          {/* Online indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms ({roomCounts.all})</SelectItem>
                <SelectItem value="Vacant">Vacant ({roomCounts.Vacant})</SelectItem>
                <SelectItem value="Reserved">Reserved ({roomCounts.Reserved})</SelectItem>
                <SelectItem value="Occupied">Occupied ({roomCounts.Occupied})</SelectItem>
                <SelectItem value="Dirty">Dirty ({roomCounts.Dirty})</SelectItem>
                <SelectItem value="Under Maintenance">Maintenance ({roomCounts["Under Maintenance"]})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={pageLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${pageLoading ? 'animate-spin' : ''}`} />
            {pageLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 px-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">Error Loading Rooms</h4>
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show loading spinner for refresh, not initial load */}
      {pageLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Refreshing rooms...</span>
        </div>
      )}
      
      <div>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-[calc(100vh-16rem)] overflow-y-auto px-2 custom-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#9ca3af #f3f4f6",
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #9ca3af;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #6b7280;
              }
            `
          }} />
          {filteredAndSortedRooms.map((room) => (
            <RoomCard 
              key={room.room_id} 
              room={room} 
              isLoading={initialLoad}
            />
          ))}
        </div>
        
        {/* No rooms message */}
        {filteredAndSortedRooms.length === 0 && !pageLoading && dataFetched && !initialLoad && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {rooms.length === 0 ? "No rooms found" : `No ${statusFilter.toLowerCase()} rooms found`}
            </p>
            <p className="text-sm">
              {rooms.length === 0 
                ? "No rooms are currently available."
                : `No rooms with "${statusFilter}" status are currently available.`
              }
            </p>
          </div>
        )}

        {/* Initial loading state - show skeleton rooms */}
        {rooms.length === 0 && initialLoad && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-gray-200 h-20 sm:h-24 md:h-28 lg:h-[7rem] border border-gray-300 rounded-lg p-1 sm:p-2 animate-pulse">
                <div className="h-full flex flex-col justify-between">
                  <div className="w-6 h-6 bg-gray-300 rounded-full ml-auto"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// Reusable Room Card
const RoomCard = ({ room, isLoading }) => {

  const getStatusIcon = (status, isLoading = false) => {
    const iconClass =
      "w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white font-bold relative";

    // Show skeleton loading if still loading initial data
    if (isLoading) {
      return (
        <div className={`${iconClass} bg-gray-300 animate-pulse`}>
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded"></div>
        </div>
      );
    }

    switch (status) {
      case "Vacant":
        return <div className={`${iconClass} bg-[#065F46]`}><img src={VacantIcon} alt="Vacant" className="w-3 h-3 sm:w-4 sm:h-4" /></div>;
      case "Reserved":
        return <div className={`${iconClass} bg-[#92400E]`}><img src={ReservedIcon} alt="Reserved" className="w-3 h-3 sm:w-4 sm:h-4" /></div>;
      case "Occupied":
        return <div className={`${iconClass} bg-[#3730A3]`}><img src={OccupiedIcon} alt="Occupied" className="w-3 h-3 sm:w-4 sm:h-4" /></div>;
      case "Dirty":
        return <div className={`${iconClass} bg-[#B91C1C]`}><img src={DirtyIcon} alt="Dirty" className="w-3 h-3 sm:w-4 sm:h-4" /></div>;
      case "Under Maintenance":
        return <div className={`${iconClass} bg-[#C2410C]`}><img src={MaintenanceIcon} alt="Under Maintenance" className="w-3 h-3 sm:w-4 sm:h-4" /></div>;
      default:
        return <div className={`${iconClass} bg-gray-400`}>?</div>;
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case "Vacant":
        return "bg-[#065F46]";
      case "Reserved":
        return "bg-[#92400E]";
      case "Occupied":
        return "bg-[#3730A3]";
      case "Dirty":
        return "bg-[#B91C1C]";
      case "Under Maintenance":
        return "bg-[#C2410C]";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status, isLoading = false) => {
    if (isLoading) {
      return null; // Handled in JSX
    }

    switch (status) {
      case "Vacant":
        return "Vacant & Clean";
      case "Reserved":
        return "Reserved";
      case "Occupied":
        return "Occupied";
      case "Under Maintenance":
        return "Under Maintenance";
      case "Dirty":
        return "Dirty";
      default:
        return status;
    }
  };

  const bgClass = isLoading ? "bg-gray-100" : getStatusBackground(room.status);

  return (
    <div className={`${bgClass} h-20 sm:h-24 md:h-28 lg:h-[7rem] border border-gray-300 rounded-lg p-1 sm:p-2 hover:shadow-md transition-shadow cursor-pointer relative min-w-0`}>
      {/* Status Icon */}
      <div className="absolute top-1 right-1">
        {getStatusIcon(room.status, isLoading)}
      </div>

      {/* Room Number */}
      {isLoading ? (
        <div className="h-3 bg-gray-300 rounded animate-pulse w-16 mb-1"></div>
      ) : (
        <div className="text-xs text-white mb-1 truncate">Room {room.room_number}</div>
      )}

      {/* Room Type */}
      {isLoading ? (
        <div className="h-4 bg-gray-300 rounded animate-pulse w-20 mb-1"></div>
      ) : (
        <div className="font-bold text-white mb-1 text-xs sm:text-sm truncate">
          {room.room_type}
        </div>
      )}

      {/* Status and Floor */}
      <div className="text-xs text-white flex items-center gap-1 flex-row flex-wrap">
        {isLoading ? (
          <div className="h-3 bg-gray-300 rounded animate-pulse w-16"></div>
        ) : (
          <div className="truncate text-xs">
            {getStatusText(room.status)}
          </div>
        )}
        <span className={`h-1 w-1 rounded-full bg-gray-400 inline-block flex-shrink-0 ${isLoading ? 'invisible' : ''}`}></span>
        {isLoading ? (
          <div className="h-3 bg-gray-300 rounded animate-pulse w-12"></div>
        ) : (
          <div className="truncate text-xs">Floor {room.floor}</div>
        )}
      </div>
    </div>
  );
};

export default RoomList;