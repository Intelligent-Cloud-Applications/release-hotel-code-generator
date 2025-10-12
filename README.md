# Hotel Booking Application - Architecture Documentation

## 🏗️ **Project Structure Overview**

This document provides a comprehensive overview of the application's architecture, focusing on the Electron main process and Offline functionality components.

---

## ⚡ **Electron Main Process (`src/electron/main/`)**

The Electron main process handles the desktop application's core functionality, database management, and system-level operations.

### **Core Files:**

#### **`index.js`** - Main Process Entry Point
- **Purpose**: Main Electron process initialization and configuration
- **Key Responsibilities**:
  - Application lifecycle management (ready, window-all-closed, activate)
  - Database initialization and schema setup
  - IPC (Inter-Process Communication) handler registration
  - Window creation and management
  - Security settings and permissions

#### **`databaseService.js`** - Database Management Service
- **Purpose**: SQLite database operations and management
- **Key Responsibilities**:
  - Database connection and initialization
  - Table creation and schema management
  - CRUD operations for all data entities
  - Transaction handling and data integrity
  - Query execution and result processing

#### **`ipcHandlers.js`** - IPC Communication Handlers
- **Purpose**: Handles communication between main and renderer processes
- **Key Responsibilities**:
  - Guest management operations (create, read, update, delete)
  - Booking management operations (create, read, update, delete)
  - Room management operations
  - Data synchronization operations
  - Error handling and response formatting

---

## �� **Offline Functionality (`src/offline/`)**

The offline system provides a robust offline-first architecture that ensures data persistence and synchronization when network connectivity is restored.

### **Services (`src/offline/services/`)**

#### **`operationQueueService.js`** - Operation Queue Management
- **Purpose**: Manages the queue of pending operations for synchronization
- **Key Responsibilities**:
  - Queuing CREATE/UPDATE/DELETE operations
  - Processing queued operations in chronological order
  - Retry logic with exponential backoff
  - Status tracking (pending, processing, synced, failed)
  - Queue statistics and monitoring

#### **`syncService.js`** - Synchronization Orchestration
- **Purpose**: Coordinates the overall synchronization process
- **Key Responsibilities**:
  - Network status monitoring
  - Automatic and manual sync triggers
  - Integration with operation queue
  - Sync status reporting
  - Error handling and recovery

#### **`apiIntegrationService.js`** - API Endpoint Management
- **Purpose**: Maps local operations to external API endpoints
- **Key Responsibilities**:
  - API function configuration
  - Table-to-API mapping
  - Generic API call handling
  - Error handling and response processing

#### **`bookingService.js`** - Booking Data Management
- **Purpose**: Handles all booking-related operations with offline-first approach
- **Key Responsibilities**:
  - Local booking creation, updates, and deletion
  - Operation queuing for synchronization
  - Immediate sync when online
  - Data validation and integrity

#### **`guestService.js`** - Guest Data Management
- **Purpose**: Handles all guest-related operations with offline-first approach
- **Key Responsibilities**:
  - Local guest creation, updates, and deletion
  - Operation queuing for synchronization
  - Immediate sync when online
  - Data validation and integrity

#### **`databaseService.js`** - Offline Database Operations
- **Purpose**: Provides database operations for the offline system
- **Key Responsibilities**:
  - Local data persistence
  - Query execution
  - Transaction management
  - Data integrity checks

#### **`index.js`** - Service Exports
- **Purpose**: Central export point for all offline services
- **Key Responsibilities**:
  - Service availability management
  - Dependency injection
  - Service initialization

### **Hooks (`src/offline/hooks/`)**

#### **`useOfflineBooking.js`** - React Hook for Offline Booking
- **Purpose**: React hook providing offline-first booking functionality
- **Key Responsibilities**:
  - Network status monitoring
  - Offline data creation and management
  - Synchronization status tracking
  - Manual sync triggers
  - Queue statistics and management

---

## 🔄 **Operation Queue System Architecture**

### **Core Components:**
1. **Queue Table**: `sync_queue` table in SQLite database
2. **Operation Types**: CREATE, UPDATE, DELETE
3. **Status Tracking**: pending → processing → synced/failed
4. **Retry Logic**: Exponential backoff for failed operations
5. **Chronological Processing**: Operations processed in timestamp order

### **Data Flow:**
1. **Offline Operation**: Data saved locally + queued for sync
2. **Online Detection**: Network status change triggers sync
3. **Queue Processing**: Operations processed in order
4. **API Integration**: Local operations mapped to external APIs
5. **Status Update**: Successful operations marked as synced

---

## ��️ **Database Schema**

### **Main Tables:**
- `guests`: Guest information storage
- `bookings`: Booking records and details
- `rooms`: Room inventory and status
- `sync_queue`: Operation synchronization queue

### **Sync Queue Schema:**
```sql
CREATE TABLE sync_queue (
  queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('CREATE', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data_payload TEXT NOT NULL,
  timestamp INTEGER DEFAULT (strftime('%s', 'now')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  last_retry_at INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'synced', 'failed')),
  error_message TEXT,
  synced_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
)
```

---

## 🚀 **Usage Patterns**

### **Creating Data Offline:**
1. Call service method (e.g., `createBooking`)
2. Data saved locally immediately
3. Operation queued for synchronization
4. Sync occurs when network available

### **Manual Synchronization:**
1. Call `manualSync()` with API functions
2. Queue processes all pending operations
3. Real-time progress updates
4. Error handling and retry logic

### **Monitoring and Management:**
1. Check `pendingSyncCount` for queue status
2. Use `getQueueStats()` for detailed metrics
3. Monitor sync status and errors
4. Manage failed operations with retry/reset

---

## 🔧 **Configuration and Setup**

### **API Integration Setup:**
```javascript
// Configure API functions for synchronization
const apiFunctions = {
  guests: {
    create: createGuestApi,
    update: updateGuestApi,
    delete: deleteGuestApi
  },
  bookings: {
    create: createBookingApi,
    update: updateBookingApi,
    delete: deleteBookingApi
  }
};

// Pass to sync operations
await manualSync(apiFunctions);
```

### **Service Initialization:**
```javascript
// Services are automatically initialized as singletons
import { operationQueueService, syncService } from './offline/services';

// Ready to use immediately
const pendingCount = await operationQueueService.getPendingCount();
```

---

## 📊 **Monitoring and Debugging**

### **Console Logging:**
- Extensive logging throughout the sync process
- Network status changes
- Queue processing steps
- API call results
- Error details and retry attempts

### **Status Tracking:**
- Real-time sync status
- Queue statistics
- Failed operation details
- Retry counts and timing

---

## 🛡️ **Error Handling and Resilience**

### **Retry Strategy:**
- Exponential backoff for failed operations
- Configurable max retry attempts
- Detailed error logging
- Graceful degradation

### **Data Integrity:**
- Local-first data persistence
- Transaction-based operations
- Conflict resolution strategies
- Backup and recovery mechanisms

---

## 🔮 **Future Enhancements**

### **Planned Features:**
- Conflict resolution for concurrent updates
- Data compression for large payloads
- Batch processing for multiple operations
- Advanced retry strategies
- Performance optimization

### **Scalability Considerations:**
- Queue partitioning for large datasets
- Background sync processes
- Memory management for large queues
- Database optimization strategies
