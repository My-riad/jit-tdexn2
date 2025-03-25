import React from 'react'; // version ^18.2.0
import { render, screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import jest from 'jest'; // version ^29.5.0

import { renderWithProviders, setupMockServer } from '../../../../shared/tests/utils/renderWithProviders';
import { mockApiResponse, mockApiError } from '../../../../shared/tests/utils/testUtils';
import FleetSummaryCard from '../../../src/components/dashboard/FleetSummaryCard';
import { getFleetSummary } from '../../../src/services/fleetService';

// Mock data for fleet summary
const mockFleetSummary = {
  totalVehicles: 48,
  activeVehicles: 42,
  availableVehicles: 6,
  inUseVehicles: 36,
  maintenanceVehicles: 2,
  outOfServiceVehicles: 4,
  fleetUtilizationPercentage: 88,
  averageVehicleAge: 3.5,
  vehiclesByType: {
    TRACTOR: 40,
    TRAILER: 8,
  },
};

// Mock carrier ID for testing
const mockCarrierId = 'carrier-123';

// Test suite for FleetSummaryCard component
describe('FleetSummaryCard', () => {
  // Setup mock server for API requests
  let cleanup: Function;

  beforeAll(() => {
    cleanup = setupMockServer();
  });

  afterAll(() => {
    cleanup();
  });

  // Test case for rendering the component with loading state
  test('renders loading state initially', async () => {
    // Mock API response with delay
    mockApiResponse('get', `/api/v1/carriers/${mockCarrierId}/fleet-summary`, {}, 200);

    // Render the FleetSummaryCard component
    renderWithProviders(<FleetSummaryCard carrierId={mockCarrierId} />);

    // Verify loading indicator is displayed
    expect(screen.getByText('Loading fleet summary...')).toBeInTheDocument();
  });

  // Test case for rendering the component with fleet data
  test('renders fleet summary data correctly', async () => {
    // Mock API response with fleet summary data
    mockApiResponse('get', `/api/v1/carriers/${mockCarrierId}/fleet-summary`, mockFleetSummary, 200);

    // Render the FleetSummaryCard component
    renderWithProviders(<FleetSummaryCard carrierId={mockCarrierId} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Total Trucks')).toBeInTheDocument();
    });

    // Verify total vehicles count is displayed
    expect(screen.getByText(String(mockFleetSummary.totalVehicles))).toBeInTheDocument();

    // Verify active vehicles count is displayed
    expect(screen.getByText(String(mockFleetSummary.activeVehicles))).toBeInTheDocument();

    // Verify available vehicles count is displayed
    expect(screen.getByText(String(mockFleetSummary.availableVehicles))).toBeInTheDocument();

    // Verify maintenance vehicles count is displayed
    expect(screen.getByText(String(mockFleetSummary.maintenanceVehicles))).toBeInTheDocument();
  });

  // Test case for handling API errors
  test('handles API errors gracefully', async () => {
    // Mock API error response
    mockApiError('get', `/api/v1/carriers/${mockCarrierId}/fleet-summary`, 'Failed to fetch fleet summary', 500);

    // Render the FleetSummaryCard component
    renderWithProviders(<FleetSummaryCard carrierId={mockCarrierId} />);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch fleet summary')).toBeInTheDocument();
    });
  });

  // Test case for the View Fleet button
  test('calls onViewFleet when View Fleet button is clicked', async () => {
    // Create mock function for onViewFleet callback
    const onViewFleet = jest.fn();

    // Mock API response with fleet summary data
    mockApiResponse('get', `/api/v1/carriers/${mockCarrierId}/fleet-summary`, mockFleetSummary, 200);

    // Render the FleetSummaryCard component with onViewFleet prop
    renderWithProviders(<FleetSummaryCard carrierId={mockCarrierId} onViewFleet={onViewFleet} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('View Fleet')).toBeInTheDocument();
    });

    // Find and click the View Fleet button
    const viewFleetButton = screen.getByText('View Fleet');
    viewFleetButton.click();

    // Verify onViewFleet callback was called
    expect(onViewFleet).toHaveBeenCalled();
  });
});