import React from 'react'; // version: ^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // version: ^14.0.0
import { rest } from 'msw'; // version: ^1.2.1
import { server } from 'msw/node'; // version: ^1.2.1
import { NavigationContainer } from '@react-navigation/native'; // version: ^6.1.6
import { createStackNavigator } from '@react-navigation/stack'; // version: ^6.3.16

import LoadDetailScreen from '../../src/screens/LoadDetailScreen';
import { renderWithProviders, setupMockServer } from '../../../shared/tests/utils/renderWithProviders';
import { LoadStatus, EquipmentType, LoadLocationType, LoadWithDetails } from '../../../common/interfaces/load.interface';
import { LoadActionTypes } from '../../src/store/actions/loadActions';

// Mock data for testing
const mockLoad: LoadWithDetails = {
  id: 'load-123',
  shipperId: 'shipper-123',
  referenceNumber: 'REF-123',
  description: 'Mock Load',
  equipmentType: EquipmentType.DRY_VAN,
  weight: 10000,
  dimensions: { length: 40, width: 8, height: 8 },
  volume: 2560,
  pallets: 20,
  commodity: 'Electronics',
  status: LoadStatus.AVAILABLE,
  pickupEarliest: '2024-01-20T08:00:00Z',
  pickupLatest: '2024-01-20T12:00:00Z',
  deliveryEarliest: '2024-01-21T08:00:00Z',
  deliveryLatest: '2024-01-21T12:00:00Z',
  offeredRate: 1200,
  specialInstructions: 'Handle with care',
  isHazardous: false,
  temperatureRequirements: null,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  locations: [
    {
      id: 'location-1',
      loadId: 'load-123',
      locationType: LoadLocationType.PICKUP,
      facilityName: 'Mock Pickup Location',
      address: { street1: '123 Main St', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA' },
      coordinates: { latitude: 41.8781, longitude: -87.6298 },
      earliestTime: '2024-01-20T08:00:00Z',
      latestTime: '2024-01-20T12:00:00Z',
      contactName: 'John Doe',
      contactPhone: '555-123-4567',
      specialInstructions: 'Call before arrival'
    },
    {
      id: 'location-2',
      loadId: 'load-123',
      locationType: LoadLocationType.DELIVERY,
      facilityName: 'Mock Delivery Location',
      address: { street1: '456 Elm St', city: 'Detroit', state: 'MI', zipCode: '48201', country: 'USA' },
      coordinates: { latitude: 42.3314, longitude: -83.0458 },
      earliestTime: '2024-01-21T08:00:00Z',
      latestTime: '2024-01-21T12:00:00Z',
      contactName: 'Jane Smith',
      contactPhone: '555-987-6543',
      specialInstructions: 'Use loading dock B'
    }
  ],
  statusHistory: [],
  documents: [],
  assignments: [],
  shipper: {
    id: 'shipper-123',
    name: 'Mock Shipper',
    contactInfo: { phone: '555-111-2222', email: 'shipper@example.com' }
  },
  efficiencyScore: 85
};

const mockRecommendation = {
  loadId: 'load-123',
  driverId: 'driver-123',
  origin: 'Chicago, IL',
  destination: 'Detroit, MI',
  equipmentType: EquipmentType.DRY_VAN,
  weight: 42000,
  pickupDate: '2024-01-20T08:00:00Z',
  deliveryDate: '2024-01-21T12:00:00Z',
  distance: 304,
  rate: 950,
  ratePerMile: 3.12,
  efficiencyScore: 95,
  scoringFactors: [
    { factor: 'empty_miles', description: 'Reduces empty miles by 87%', impact: 25 },
    { factor: 'demand_zone', description: 'Positions you for high-demand area', impact: 20 },
    { factor: 'home_time', description: 'Aligns with your home time preferences', impact: 15 },
    { factor: 'equipment_match', description: 'Matches your equipment perfectly', impact: 10 }
  ],
  expiresAt: '2024-01-16T12:00:00Z'
};

const mockDriver = {
  id: 'driver-123',
  firstName: 'John',
  lastName: 'Doe'
};

const preloadedState = {
  auth: { user: mockDriver },
  load: { activeLoad: mockLoad, loading: false, error: null }
};

// Mock functions for navigation and Redux dispatch
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockDispatch = jest.fn();

// Mock the Share.share function
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: {
    share: jest.fn().mockResolvedValue({}),
  },
}));

const Stack = createStackNavigator();

describe('LoadDetailScreen', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders loading state while fetching load details', async () => {
    const cleanup = setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState: { auth: { user: mockDriver }, load: { activeLoad: null, loading: true, error: null } } }
    );
    expect(screen.getByTestId('loading-indicator')).toBeVisible();
    cleanup();
  });

  it('renders load details correctly when data is loaded', async () => {
    const cleanup = setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState }
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Load')).toBeVisible();
      expect(screen.getByText('Mock Pickup Location')).toBeVisible();
      expect(screen.getByText('Mock Delivery Location')).toBeVisible();
      expect(screen.getByText('40\' × 8\' × 8\'')).toBeVisible();
      expect(screen.getByText('$1,300.00')).toBeVisible();
    });
    cleanup();
  });

  it('displays error message when load is not found', async () => {
    setupMockServer();
    server.use(
      rest.get(`${API_BASE_URL}/api/v1/loads/load-123`, (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ message: 'Load not found' }));
      })
    );

    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState: { auth: { user: mockDriver }, load: { activeLoad: null, loading: false, error: null } } }
    );

    await waitFor(() => {
      expect(screen.getByText('Load details not found.')).toBeVisible();
    });
  });

  it('dispatches fetchLoadDetails action on mount', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { store: { dispatch: mockDispatch, getState: () => ({ auth: { user: mockDriver }, load: { activeLoad: null, loading: false, error: null } }) } }
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'FETCH_LOAD_DETAILS_REQUEST'
      }));
    });
  });

  it('shows accept and decline buttons for AVAILABLE loads', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState }
    );

    await waitFor(() => {
      expect(screen.getByText('Accept Load')).toBeVisible();
      expect(screen.getByText('Decline Load')).toBeVisible();
    });
  });

  it('shows navigate and call buttons for ASSIGNED loads', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState: { auth: { user: mockDriver }, load: { activeLoad: { ...mockLoad, status: LoadStatus.ASSIGNED }, loading: false, error: null } } }
    );

    await waitFor(() => {
      expect(screen.getByText('Navigate to Pickup')).toBeVisible();
    });
  });

  it('shows loaded button for AT_PICKUP loads', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState: { auth: { user: mockDriver }, load: { activeLoad: { ...mockLoad, status: LoadStatus.AT_PICKUP }, loading: false, error: null } } }
    );

    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeVisible();
    });
  });

  it('dispatches acceptLoadAction when accept button is pressed', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { store: { dispatch: mockDispatch, getState: () => ({ auth: { user: mockDriver }, load: { activeLoad: mockLoad, loading: false, error: null } }) }, preloadedState }
    );

    fireEvent.press(screen.getByText('Accept Load'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'ACCEPT_LOAD_REQUEST'
      }));
    });
  });

  it('dispatches declineLoadAction when decline button is pressed', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { store: { dispatch: mockDispatch, getState: () => ({ auth: { user: mockDriver }, load: { activeLoad: mockLoad, loading: false, error: null } }) }, preloadedState }
    );

    fireEvent.press(screen.getByText('Decline Load'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'DECLINE_LOAD_REQUEST'
      }));
    });
  });

  it('dispatches updateLoadStatusAction when status update button is pressed', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { store: { dispatch: mockDispatch, getState: () => ({ auth: { user: mockDriver }, load: { activeLoad: { ...mockLoad, status: LoadStatus.AT_PICKUP } , loading: false, error: null } }) }, preloadedState: { auth: { user: mockDriver }, load: { activeLoad: { ...mockLoad, status: LoadStatus.AT_PICKUP }, loading: false, error: null } } }
    );

    fireEvent.press(screen.getByText('Loaded'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'UPDATE_LOAD_STATUS_REQUEST'
      }));
    });
  });

  it('toggles favorite status when favorite button is pressed', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState }
    );

    const favoriteButton = await screen.findByLabelText('Toggle Favorite');
    fireEvent.press(favoriteButton);
    await waitFor(() => {
      expect(favoriteButton).toHaveTextContent('★');
    });

    fireEvent.press(favoriteButton);
    await waitFor(() => {
      expect(favoriteButton).toHaveTextContent('☆');
    });
  });

  it('opens share dialog when share button is pressed', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState }
    );

    const shareButton = await screen.findByLabelText('Share');
    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(jest.requireMock('react-native').Share.share).toHaveBeenCalledWith({
        message: 'Check out this load: REF-123',
        title: 'Load Details',
      });
    });
  });

  it('displays efficiency score and factors correctly', async () => {
    setupMockServer();
    renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoadDetail" component={LoadDetailScreen} initialParams={{ loadId: 'load-123' }} />
        </Stack.Navigator>
      </NavigationContainer>,
      { preloadedState: { auth: { user: mockDriver }, load: { activeLoad: mockLoad, loading: false, error: null } } }
    );

    await waitFor(() => {
      expect(screen.getByText('85')).toBeVisible();
      expect(screen.getByText('Reduces empty miles by 87%')).toBeVisible();
      expect(screen.getByText('+25')).toBeVisible();
    });
  });
});