# Hotel Management Loading System

A comprehensive loading system designed specifically for hotel management applications with beautiful animations and multiple loading states.

## Components

### 1. HotelLoader
The main loader component with hotel-themed animations including:
- Animated hotel buildings
- Service icons (Rooms, Dining, WiFi, Parking, Service)
- Spinning progress indicators
- Gradient background with floating elements

### 2. LoadingStates
A collection of different loading components:
- `GlobalLoader` - Full-screen loader with different types
- `CompactLoader` - Small loader for cards and sections
- `OverlayLoader` - Modal-style overlay loader
- `InlineLoader` - Tiny spinner for buttons
- `TableRowLoader` - Skeleton loader for table rows
- `CardLoader` - Skeleton loader for cards

### 3. LoadingButton
A button component with built-in loading states:
```jsx
<LoadingButton
  loading={isLoading}
  onClick={handleClick}
  variant="primary"
  size="md"
>
  Submit
</LoadingButton>
```

## Usage

### Basic Usage with Context

```jsx
import {useLoading} from './useLoading';

const MyComponent = () => {
  const {withLoading, startLoading, stopLoading, isKeyLoading} = useLoading();

  const handleApiCall = async () => {
    // Automatically handles loading state
    const result = await withLoading(
      'my-api-call',
      () => fetchData(),
      'DATA_LOADING',
      'overlay'
    );
  };

  const handleManualLoading = () => {
    startLoading('manual-loading', 'BOOKING_LOADING', 'overlay');
    // Do something...
    stopLoading('manual-loading');
  };

  return (
    <LoadingButton
      loading={isKeyLoading('my-api-call')}
      onClick={handleApiCall}
    >
      Load Data
    </LoadingButton>
  );
};
```

### Loading Types

- `APP_LOADING` - Initial app loading
- `INSTITUTION_LOADING` - Hotel data loading
- `AUTH_LOADING` - Authentication
- `DATA_LOADING` - General data fetching
- `SUBMITTING` - Form submissions
- `ROOM_LOADING` - Room operations
- `BOOKING_LOADING` - Booking operations
- `REPORT_LOADING` - Report generation

### Loading Variants

- `full` - Full-screen loader (default)
- `overlay` - Modal-style overlay
- `compact` - Small inline loader

### Context Integration

The loading system is automatically integrated with:
- `InstitutionContext` - Shows loader while loading hotel data
- `AuthContext` - Shows loader while authenticating
- `LoadingContext` - Global loading state management

## Examples

### Form Submission
```jsx
const handleSubmit = async (formData) => {
  await withLoading(
    'form-submit',
    () => submitForm(formData),
    'SUBMITTING',
    'overlay'
  );
};
```

### Room Operations
```jsx
const handleRoomUpdate = async (roomId, data) => {
  await withLoading(
    'room-update',
    () => updateRoom(roomId, data),
    'ROOM_LOADING',
    'overlay'
  );
};
```

### Report Generation
```jsx
const generateReport = async () => {
  await withLoading(
    'report-generation',
    () => createReport(),
    'REPORT_LOADING',
    'overlay'
  );
};
```

## Styling

The loaders use Tailwind CSS classes and can be customized by modifying the component files. The hotel theme includes:
- Blue and amber color scheme
- Smooth animations
- Hotel building icons
- Service-related icons
- Gradient backgrounds

## Performance

- Lightweight components
- Efficient state management
- Minimal re-renders
- Smooth animations using CSS transforms
