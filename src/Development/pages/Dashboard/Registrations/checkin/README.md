# Check-In Component Structure

This folder contains the modular check-in system with separated concerns for better maintainability and reusability.

## Component Structure

### Main Component
- **`index.jsx`** - Main CheckIn component that orchestrates all sub-components

### Sub-Components

#### Core Components
- **`BookingSelector.jsx`** - Handles booking selection dialog with search functionality
- **`CheckInForm.jsx`** - Form component for check-in details and data entry
- **`PriceSummary.jsx`** - Displays price calculations and breakdown
- **`ValidationSummary.jsx`** - Shows validation errors in a user-friendly format

#### UI Components
- **`SelectedBookingInfo.jsx`** - Displays selected booking information
- **`ActionButtons.jsx`** - Handles action buttons (Clear Selection, Complete Check-In)
- **`EmptyState.jsx`** - Shows empty state when no booking is selected
- **`LoadingState.jsx`** - Displays loading spinner and message

## Component Responsibilities

### index.jsx
- Manages overall state and data flow
- Handles API calls and data fetching
- Orchestrates component interactions
- Manages validation logic
- Handles form submission

### BookingSelector.jsx
- Displays booking selection dialog
- Handles search functionality
- Shows booking list with guest information
- Manages booking selection

### CheckInForm.jsx
- Renders all form fields for check-in data
- Handles input validation
- Manages form state updates
- Displays field-specific error messages

### PriceSummary.jsx
- Calculates and displays pricing information
- Shows rate plan and room tariffs
- Displays discount calculations
- Shows partial payment information

### ValidationSummary.jsx
- Displays all validation errors in one place
- Provides clear error messages
- Only shows when there are validation errors

### SelectedBookingInfo.jsx
- Shows selected booking details
- Displays guest information
- Shows booking dates and room type

### ActionButtons.jsx
- Handles form submission
- Manages button states (loading, disabled, etc.)
- Provides clear action buttons

### EmptyState.jsx
- Shows when no booking is selected
- Provides call-to-action to select booking
- Clean, user-friendly empty state

### LoadingState.jsx
- Reusable loading component
- Shows spinner and custom message
- Used for initial page loading

## Data Flow

1. **Initialization**: `index.jsx` loads rooms and staff data
2. **Booking Selection**: User selects booking via `BookingSelector`
3. **Data Population**: Selected booking data populates `CheckInForm`
4. **Validation**: Real-time validation as user interacts with form
5. **Price Calculation**: Automatic price updates based on selections
6. **Submission**: Form submission handled by `ActionButtons`

## State Management

- **Local State**: Managed in `index.jsx` for form data and UI state
- **Context**: Uses `AppContext` for global data (rooms, staff, bookings)
- **Validation**: Real-time validation with error state management
- **Loading States**: Multiple loading states for different operations

## Usage

```jsx
import CheckIn from './pages/Dashboard/Registrations/checkin';

// The component is self-contained and handles all check-in logic
<CheckIn />
```

## Features

- ✅ Modular component architecture
- ✅ Real-time validation
- ✅ Price calculation
- ✅ Booking selection with search
- ✅ Staff assignment
- ✅ Room assignment
- ✅ Discount handling
- ✅ Partial payment support
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design 