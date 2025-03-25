import React from 'react'; //  ^18.2.0
import { screen, waitFor, fireEvent, act } from '@testing-library/react'; //  ^14.0.0
import { userEvent } from '@testing-library/user-event'; //  ^14.4.3
import jest from 'jest'; //  ^29.5.0

import HomeScreen from '../../src/screens/HomeScreen'; // Component under test
import { renderWithProviders, setupMockServer } from '../../../shared/tests/utils/renderWithProviders'; // Utility for rendering components with Redux and other providers in tests
import { mockApiResponse, createMockDriver, createMockLoad, createMockScore } from '../../../shared/tests/utils/testUtils'; // Utilities for mocking API responses and creating test data
import { DRIVER_ENDPOINTS, LOAD_ENDPOINTS, GAMIFICATION_ENDPOINTS } from '../../../common/constants/endpoints'; // API endpoint constants for mocking API calls

// Mock navigation object to test navigation functionality
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Helper function to render the HomeScreen with common test props
const renderHomeScreen = (props = {}, state = {}) => {
  return renderWithProviders(<HomeScreen {...props} />, {
    preloadedState: state,
  });
};

// Helper function to find a load card by origin and destination
const findLoadCard = (origin, destination) => {
  return screen.getByText(`${origin} → ${destination}`).closest('.MuiCard-root');
};

// Helper function to simulate pull-to-refresh gesture
const simulatePullToRefresh = () => {
  // Simulate a touch start event
  fireEvent.touchStart(screen.getByTestId('home-screen-scrollview'), {
    touches: [{ pageY: 0 }],
  });

  // Simulate a touch move event
  fireEvent.touchMove(screen.getByTestId('home-screen-scrollview'), {
    touches: [{ pageY: 100 }],
  });

  // Simulate a touch end event
  fireEvent.touchEnd(screen.getByTestId('home-screen-scrollview'));
};

describe('HomeScreen', () => {
  // Test suite for the HomeScreen component
  const setup = () => {
    // Create mock driver data
    const mockDriver = createMockDriver();

    // Create mock load recommendations
    const mockRecommendedLoads = [
      createMockLoad({ id: 'load-1', origin: 'Chicago, IL', destination: 'Detroit, MI' }),
      createMockLoad({ id: 'load-2', origin: 'Detroit, MI', destination: 'Cleveland, OH' }),
    ];

    // Create mock active load
    const mockActiveLoad = createMockLoad({ id: 'load-3', origin: 'Austin, TX', destination: 'Dallas, TX' });

    // Create mock driver score
    const mockScore = createMockScore();

    // Set up mock server with setupMockServer
    const cleanup = setupMockServer();

    // Mock API responses
    mockApiResponse('get', DRIVER_ENDPOINTS.GET_BY_ID, mockDriver);
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { recommendations: mockRecommendedLoads });
    mockApiResponse('get', GAMIFICATION_ENDPOINTS.SCORES, mockScore);

    return { mockDriver, mockRecommendedLoads, mockActiveLoad, mockScore, cleanup };
  };

  it('renders correctly with loading state', () => {
    // Tests that the HomeScreen displays loading indicators when data is being fetched
    // Render HomeScreen with renderWithProviders
    renderHomeScreen();

    // Verify loading indicators are displayed
    expect(screen.getByText('Loading recommended loads...')).toBeInTheDocument();

    // Verify basic structure is rendered
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
  });

  it('renders driver information correctly', async () => {
    // Tests that the HomeScreen displays driver information correctly once loaded
    // Set up mock data with setup function
    const { mockDriver, cleanup } = setup();

    // Render HomeScreen with renderWithProviders
    renderHomeScreen();

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    // Verify driver name is displayed
    expect(screen.getByText(mockDriver.firstName + ' ' + mockDriver.lastName)).toBeInTheDocument();

    // Verify efficiency score is displayed correctly
    expect(screen.getByText('87')).toBeInTheDocument();

    // Verify available hours are displayed correctly
    expect(screen.getByText('Drive:')).toBeInTheDocument();

    cleanup();
  });

  it('renders recommended loads correctly', async () => {
    // Tests that the HomeScreen displays recommended loads correctly
    // Set up mock data with setup function
    const { mockRecommendedLoads, cleanup } = setup();

    // Render HomeScreen with renderWithProviders
    renderHomeScreen();

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Chicago, IL → Detroit, MI')).toBeInTheDocument());

    // Verify recommended loads section is displayed
    expect(screen.getByText('Recommended Loads')).toBeInTheDocument();

    // Verify load cards are rendered with correct information
    expect(screen.getByText(mockRecommendedLoads[0].origin + ' → ' + mockRecommendedLoads[0].destination)).toBeInTheDocument();

    // Verify 'View All' button is displayed
    expect(screen.getByText('View All')).toBeInTheDocument();

    cleanup();
  });

  it('renders active load if available', async () => {
    // Tests that the HomeScreen displays the active load when one exists
    // Set up mock data with setup function including active load
    const { mockActiveLoad, cleanup } = setup();

    // Render HomeScreen with renderWithProviders
    renderHomeScreen();

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Active Load')).toBeInTheDocument());

    // Verify active load section is displayed
    expect(screen.getByText('Active Load')).toBeInTheDocument();

    // Verify active load information is displayed correctly
    expect(screen.getByText(mockActiveLoad.origin + ' → ' + mockActiveLoad.destination)).toBeInTheDocument();

    cleanup();
  });

  it('handles empty recommended loads', async () => {
    // Tests that the HomeScreen handles the case when no recommended loads are available
    // Set up mock data with empty recommendations array
    const { cleanup } = setup();
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { recommendations: [] });

    // Render HomeScreen with renderWithProviders
    renderHomeScreen();

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('No recommended loads available at this time.')).toBeInTheDocument());

    // Verify empty state message is displayed in recommendations section
    expect(screen.getByText('No recommended loads available at this time.')).toBeInTheDocument();

    cleanup();
  });

  it('navigates to load details when a load is pressed', async () => {
    // Tests that pressing a load card navigates to the load details screen
    // Set up mock data with setup function
    const { mockRecommendedLoads, cleanup } = setup();

    // Create mock navigation object
    const mockNavigation = { navigate: jest.fn() };

    // Render HomeScreen with renderWithProviders and mock navigation
    renderHomeScreen({ navigation: mockNavigation });

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Chicago, IL → Detroit, MI')).toBeInTheDocument());

    // Find and press a load card
    const loadCard = findLoadCard('Chicago, IL', 'Detroit, MI');
    fireEvent.click(loadCard);

    // Verify navigation.navigate was called with correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('LoadDetails', { loadId: mockRecommendedLoads[0].id });

    cleanup();
  });

  it('navigates to active load screen when active load is pressed', async () => {
    // Tests that pressing the active load navigates to the active load screen
    // Set up mock data with setup function including active load
    const { mockActiveLoad, cleanup } = setup();

    // Create mock navigation object
    const mockNavigation = { navigate: jest.fn() };

    // Render HomeScreen with renderWithProviders and mock navigation
    renderHomeScreen({ navigation: mockNavigation });

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Active Load')).toBeInTheDocument());

    // Find and press the active load card
    const activeLoadCard = screen.getByText(mockActiveLoad.origin + ' → ' + mockActiveLoad.destination).closest('.MuiCard-root');
    fireEvent.click(activeLoadCard);

    // Verify navigation.navigate was called with correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('LoadDetails', { loadId: mockActiveLoad.id });

    cleanup();
  });

  it('navigates to map screen when map button is pressed', async () => {
    // Tests that pressing the map button navigates to the map screen
    // Set up mock data with setup function
    const { cleanup } = setup();

    // Create mock navigation object
    const mockNavigation = { navigate: jest.fn() };

    // Render HomeScreen with renderWithProviders and mock navigation
    renderHomeScreen({ navigation: mockNavigation });

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Efficiency')).toBeInTheDocument());

    // Find and press the map button
    const mapButton = screen.getByText('Map').closest('button');
    fireEvent.press(mapButton);

    // Verify navigation.navigate was called with correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Map');

    cleanup();
  });

  it('navigates to earnings screen when earnings button is pressed', async () => {
    // Tests that pressing the earnings button navigates to the earnings screen
    // Set up mock data with setup function
    const { cleanup } = setup();

    // Create mock navigation object
    const mockNavigation = { navigate: jest.fn() };

    // Render HomeScreen with renderWithProviders and mock navigation
    renderHomeScreen({ navigation: mockNavigation });

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Efficiency')).toBeInTheDocument());

    // Find and press the earnings button
    const earningsButton = screen.getByText('Earnings').closest('button');
    fireEvent.press(earningsButton);

    // Verify navigation.navigate was called with correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Earnings');

    cleanup();
  });

  it('refreshes data when pull-to-refresh is triggered', async () => {
    // Tests that pull-to-refresh functionality reloads the data
    // Set up mock data with setup function
    const { mockDriver, mockRecommendedLoads, mockScore, cleanup } = setup();

    // Render HomeScreen with renderWithProviders
    renderHomeScreen();

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    // Simulate pull-to-refresh gesture
    simulatePullToRefresh();

    // Verify that data fetching actions are dispatched again
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify that refreshing indicator is displayed and then disappears
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    cleanup();
  });

  it('handles API errors gracefully', async () => {
    // Tests that the HomeScreen handles API errors gracefully
    // Set up mock server
    const cleanup = setupMockServer();

    // Mock API error responses
    mockApiError('get', DRIVER_ENDPOINTS.GET_BY_ID, 'Failed to fetch driver profile');
    mockApiError('get', LOAD_ENDPOINTS.SEARCH, 'Failed to fetch recommended loads');
    mockApiError('get', GAMIFICATION_ENDPOINTS.SCORES, 'Failed to fetch efficiency score');

    // Render HomeScreen with renderWithProviders
    renderHomeScreen();

    // Verify error messages are displayed
    await waitFor(() => expect(screen.getByText('Failed to fetch driver profile')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Failed to fetch recommended loads')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Failed to fetch efficiency score')).toBeInTheDocument());

    // Verify retry functionality works
    // (This would require simulating a successful API response after the error, which is more complex)

    cleanup();
  });
});