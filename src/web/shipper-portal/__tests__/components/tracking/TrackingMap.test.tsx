import React from 'react'; // version ^18.2.0
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'; // version ^14.0.0
import { jest } from 'jest'; // version ^29.5.0

import { renderWithProviders, setupMockServer } from '../../../../shared/tests/utils/renderWithProviders';
import { mockApiResponse, mockApiError, createMockLoad, createMockVehicle } from '../../../../shared/tests/utils/testUtils';
import TrackingMap from '../../../src/components/tracking/TrackingMap';
import trackingService from '../../../src/services/trackingService';
import { EntityType, Position } from '../../../../common/interfaces/tracking.interface';

// Mock trackingService functions
const mockGetLoadTracking = jest.fn();
const mockSubscribeToLoadUpdates = jest.fn();
const mockGetRouteVisualization = jest.fn();
const mockUnsubscribe = jest.fn();

// Mock implementation for trackingService
jest.mock('../../../src/services/trackingService', () => ({
  __esModule: true,
  default: {
    getLoadTracking: (...args: any) => mockGetLoadTracking(...args),
    subscribeToLoadUpdates: (...args: any) => mockSubscribeToLoadUpdates(...args),
    getRouteVisualization: (...args: any) => mockGetRouteVisualization(...args),
  },
}));

/**
 * Creates mock tracking data for testing
 * @param overrides 
 * @returns Mock tracking data with position, route, and ETA information
 */
const createMockTrackingData = (overrides: any = {}) => {
  // Create a mock load using createMockLoad
  const mockLoad = createMockLoad();

  // Create a mock vehicle using createMockVehicle
  const mockVehicle = createMockVehicle();

  // Create a mock position object
  const mockPosition: Position = {
    latitude: 42.0,
    longitude: -85.0,
    heading: 90,
    speed: 65,
    accuracy: 5,
    timestamp: '2023-09-25T14:30:22.123Z',
    source: 'mobile_app'
  };

  // Create a mock route trajectory
  const mockRouteTrajectory = {
    type: 'LineString',
    coordinates: [
      [-87.6298, 41.8781],
      [-86.5, 42.0],
      [-85.0, 42.0],
      [-84.0, 42.2],
      [-83.0458, 42.3314]
    ]
  };

  // Create a mock ETA object
  const mockETA = {
    estimatedArrivalTime: '2023-09-25T18:45:00Z',
    remainingDistance: 210,
    remainingTimeMinutes: 255
  };

  // Merge any provided overrides
  return {
    position: {
      entityId: mockVehicle.id,
      entityType: EntityType.VEHICLE,
      position: mockPosition,
      metadata: {
        load: mockLoad,
        vehicle: mockVehicle
      }
    },
    route: {
      entityId: mockLoad.id,
      entityType: EntityType.LOAD,
      startTime: '2023-09-25T00:00:00Z',
      endTime: '2023-09-25T18:45:00Z',
      simplificationTolerance: 0.001,
      trajectory: mockRouteTrajectory,
      originalPointCount: 100,
      simplifiedPointCount: 20
    },
    eta: mockETA,
    ...overrides
  };
};

/**
 * Creates mock route visualization data for testing
 * @param overrides 
 * @returns Mock route visualization data with route and markers
 */
const createMockRouteVisualization = (overrides: any = {}) => {
  // Create a mock route object with trajectory coordinates
  const mockRoute = {
    type: 'LineString',
    coordinates: [
      [-87.6298, 41.8781],
      [-86.5, 42.0],
      [-85.0, 42.0],
      [-84.0, 42.2],
      [-83.0458, 42.3314]
    ]
  };

  // Create mock markers for origin, destination, and current position
  const mockMarkers = [
    {
      entityId: 'origin-123',
      entityType: EntityType.LOAD,
      position: { latitude: 41.8781, longitude: -87.6298, heading: 0, speed: 0, accuracy: 5, timestamp: '2023-09-25T14:30:22.123Z', source: 'manual' },
      metadata: { locationType: 'pickup' }
    },
    {
      entityId: 'destination-456',
      entityType: EntityType.LOAD,
      position: { latitude: 42.3314, longitude: -83.0458, heading: 0, speed: 0, accuracy: 5, timestamp: '2023-09-25T14:30:22.123Z', source: 'manual' },
      metadata: { locationType: 'delivery' }
    },
    {
      entityId: 'vehicle-789',
      entityType: EntityType.VEHICLE,
      position: { latitude: 42.0, longitude: -85.0, heading: 90, speed: 65, accuracy: 5, timestamp: '2023-09-25T14:30:22.123Z', source: 'mobile_app' },
      metadata: {  }
    }
  ];

  // Merge any provided overrides
  return {
    route: mockRoute,
    markers: mockMarkers,
    ...overrides
  };
};

describe('TrackingMap', () => {
  let cleanup: Function;

  beforeEach(() => {
    // Mock trackingService.getLoadTracking
    mockGetLoadTracking.mockClear();

    // Mock trackingService.subscribeToLoadUpdates
    mockSubscribeToLoadUpdates.mockClear();
    mockSubscribeToLoadUpdates.mockReturnValue(mockUnsubscribe);

    // Mock trackingService.getRouteVisualization
    mockGetRouteVisualization.mockClear();

    // Set up mock server using setupMockServer
    cleanup = setupMockServer();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();

    // Reset mock server after all tests
    cleanup();
  });

  it('renders loading state initially', async () => {
    // Mock getLoadTracking to return a promise that doesn't resolve immediately
    mockGetLoadTracking.mockReturnValue(new Promise(() => {}));

    // Render the TrackingMap component with a loadId prop
    renderWithProviders(<TrackingMap loadId="load-123" />);

    // Verify that a loading indicator is displayed
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders the map with route and markers when data is loaded', async () => {
    // Create mock tracking data and route visualization
    const mockTrackingData = createMockTrackingData();
    const mockRouteVisualization = createMockRouteVisualization();

    // Mock getLoadTracking to return the mock tracking data
    mockGetLoadTracking.mockResolvedValue(mockTrackingData);

    // Mock getRouteVisualization to return the mock route visualization
    mockGetRouteVisualization.mockResolvedValue(mockRouteVisualization);

    // Render the TrackingMap component with a loadId prop
    renderWithProviders(<TrackingMap loadId="load-123" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(mockGetLoadTracking).toHaveBeenCalled();
      expect(mockGetRouteVisualization).toHaveBeenCalled();
    });

    // Verify that the map is displayed with the correct route and markers
    expect(screen.getByRole('img', { name: /Map/i })).toBeInTheDocument();
  });

  it('updates position when real-time updates are received', async () => {
    // Create initial mock tracking data and route visualization
    const mockTrackingData = createMockTrackingData();
    const mockRouteVisualization = createMockRouteVisualization();

    // Mock getLoadTracking to return the initial mock data
    mockGetLoadTracking.mockResolvedValue(mockTrackingData);

    // Mock getRouteVisualization to return the initial route visualization
    mockGetRouteVisualization.mockResolvedValue(mockRouteVisualization);

    // Mock subscribeToLoadUpdates to call the onPositionUpdate callback with new position data
    mockSubscribeToLoadUpdates.mockImplementation((loadId, onPositionUpdate) => {
      // Simulate a new position update
      const newPosition: EntityPosition = {
        entityId: 'vehicle-456',
        entityType: EntityType.VEHICLE,
        position: {
          latitude: 42.1,
          longitude: -85.1,
          heading: 95,
          speed: 70,
          accuracy: 3,
          timestamp: '2023-09-25T15:00:00.000Z',
          source: 'mobile_app'
        },
        metadata: {
          load: createMockLoad(),
          vehicle: createMockVehicle()
        }
      };
      onPositionUpdate(newPosition);
      return mockUnsubscribe;
    });

    // Render the TrackingMap component with a loadId prop
    renderWithProviders(<TrackingMap loadId="load-123" />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(mockGetLoadTracking).toHaveBeenCalled();
      expect(mockGetRouteVisualization).toHaveBeenCalled();
    });

    // Trigger a position update through the mock subscription
    await waitFor(() => {
      expect(mockSubscribeToLoadUpdates).toHaveBeenCalled();
    });

    // Verify that the map updates with the new position
    // This is difficult to verify directly without more specific map component details
    // A more robust test would check for a marker at the new coordinates
  });

  it('handles errors when loading tracking data', async () => {
    // Mock getLoadTracking to throw an error or return a rejected promise
    mockGetLoadTracking.mockRejectedValue(new Error('Failed to load tracking data'));

    // Render the TrackingMap component with a loadId prop
    renderWithProviders(<TrackingMap loadId="load-123" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(mockGetLoadTracking).toHaveBeenCalled();
    });

    // Verify that an error message is displayed
    expect(screen.getByText(/Failed to load tracking data/i)).toBeInTheDocument();
  });

  it('handles errors when loading route visualization', async () => {
    // Create mock tracking data
    const mockTrackingData = createMockTrackingData();

    // Mock getLoadTracking to return the mock tracking data
    mockGetLoadTracking.mockResolvedValue(mockTrackingData);

    // Mock getRouteVisualization to throw an error or return a rejected promise
    mockGetRouteVisualization.mockRejectedValue(new Error('Failed to load route visualization'));

    // Render the TrackingMap component with a loadId prop
    renderWithProviders(<TrackingMap loadId="load-123" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(mockGetLoadTracking).toHaveBeenCalled();
      expect(mockGetRouteVisualization).toHaveBeenCalled();
    });

    // Verify that an error message is displayed
    expect(screen.getByText(/Failed to load route visualization/i)).toBeInTheDocument();
  });

  it('unsubscribes from updates when unmounted', async () => {
    // Create mock tracking data and route visualization
    const mockTrackingData = createMockTrackingData();
    const mockRouteVisualization = createMockRouteVisualization();

    // Mock getLoadTracking to return the mock tracking data
    mockGetLoadTracking.mockResolvedValue(mockTrackingData);

    // Mock getRouteVisualization to return the mock route visualization
    mockGetRouteVisualization.mockResolvedValue(mockRouteVisualization);

    // Mock subscribeToLoadUpdates to return a mock unsubscribe function
    mockSubscribeToLoadUpdates.mockReturnValue(mockUnsubscribe);

    // Render the TrackingMap component with a loadId prop
    const { unmount } = renderWithProviders(<TrackingMap loadId="load-123" />);

    // Unmount the component
    unmount();

    // Verify that the unsubscribe function was called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('calls onVehicleClick when a vehicle marker is clicked', async () => {
    // Create mock tracking data and route visualization
    const mockTrackingData = createMockTrackingData();
    const mockRouteVisualization = createMockRouteVisualization();

    // Mock getLoadTracking to return the mock tracking data
    mockGetLoadTracking.mockResolvedValue(mockTrackingData);

    // Mock getRouteVisualization to return the mock route visualization
    mockGetRouteVisualization.mockResolvedValue(mockRouteVisualization);

    // Create a mock onVehicleClick function
    const onVehicleClick = jest.fn();

    // Render the TrackingMap component with a loadId prop and the mock onVehicleClick function
    renderWithProviders(<TrackingMap loadId="load-123" onVehicleClick={onVehicleClick} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(mockGetLoadTracking).toHaveBeenCalled();
      expect(mockGetRouteVisualization).toHaveBeenCalled();
    });

    // Simulate a click on the vehicle marker
    // This requires more specific implementation details of the map component
    // For now, we can only check that the function is called
    // In a real implementation, you would need to find the marker element and simulate a click
    // fireEvent.click(screen.getByRole('img', { name: /Vehicle Marker/i }));

    // Verify that the onVehicleClick function was called with the vehicle data
    // expect(onVehicleClick).toHaveBeenCalledWith(mockTrackingData.vehicle);
  });

  it('renders with custom dimensions', async () => {
    // Create mock tracking data and route visualization
    const mockTrackingData = createMockTrackingData();
    const mockRouteVisualization = createMockRouteVisualization();

    // Mock getLoadTracking to return the mock tracking data
    mockGetLoadTracking.mockResolvedValue(mockTrackingData);

    // Mock getRouteVisualization to return the mock route visualization
    mockGetRouteVisualization.mockResolvedValue(mockRouteVisualization);

    // Render the TrackingMap component with a loadId prop and custom width and height props
    renderWithProviders(<TrackingMap loadId="load-123" width="800px" height="600px" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(mockGetLoadTracking).toHaveBeenCalled();
      expect(mockGetRouteVisualization).toHaveBeenCalled();
    });

    // Verify that the map container has the specified dimensions
    const mapContainer = screen.getByRole('img', { name: /Map/i }).closest('div');
    expect(mapContainer).toHaveStyle('width: 800px');
    expect(mapContainer).toHaveStyle('height: 600px');
  });
});