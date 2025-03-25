# src/web/carrier-portal/__tests__/pages/DashboardPage.test.tsx
```typescript
import React from 'react'; // version ^18.2.0
import { fireEvent, waitFor, screen } from '@testing-library/react'; // version ^14.0.0
import { act } from 'react-dom/test-utils'; // version ^18.2.0
import { rest } from 'msw'; // version ^1.0.0

import DashboardPage from '../../src/pages/DashboardPage';
import { renderWithProviders, setupMockServer } from '../../../shared/tests/utils/renderWithProviders';
import { theme } from '../../../shared/styles/theme';
import { CARRIER_PORTAL_ROUTES } from '../../../common/constants/routes';
import server from '../../../shared/tests/mocks/server';

// Mock the useNavigate hook from react-router-dom to track navigation calls
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock data for API responses
const mockFleetSummary = {
  totalVehicles: 48,
  activeVehicles: 42,
  availableVehicles: 6,
  maintenanceVehicles: 2,
  fleetUtilizationPercentage: 88,
};

const mockActiveLoads = {
  inTransit: 32,
  atPickup: 5,
  atDelivery: 3,
  pending: 8,
  total: 48,
};

const mockEfficiencyMetrics = {
  fleetScore: 84,
  emptyMiles: 12,
  networkContribution: 82,
  targetScore: 100,
  previousScore: 80,
  previousEmptyMiles: 15,
  previousNetworkContribution: 78,
};

const mockRevenueSummary = {
  today: 12450,
  thisWeek: 87320,
  thisMonth: 342560,
  averagePerMile: 3.24,
};

const mockUpcomingDeliveries = [
  { time: '10:30AM', loadId: 'LD-5678', driver: { id: 'DR-101', name: 'Michael B.' }, location: 'Chicago, IL', status: 'At Pickup' },
  { time: '11:45AM', loadId: 'LD-5679', driver: { id: 'DR-102', name: 'Jennifer T.' }, location: 'Detroit, MI', status: 'In Transit' },
  { time: '01:15PM', loadId: 'LD-5680', driver: { id: 'DR-103', name: 'Robert K.' }, location: 'Cleveland, OH', status: 'In Transit' },
  { time: '02:30PM', loadId: 'LD-5681', driver: { id: 'DR-104', name: 'Sarah L.' }, location: 'Pittsburgh, PA', status: 'In Transit' },
];

const mockOptimizationOpportunities = [
  { description: 'Combine loads LD-5682 and LD-5683 for relay opportunity', savings: '$320', emptyMilesReduction: '180' },
  { description: 'Reschedule load LD-5684 pickup window to 2:00-4:00PM', savings: '$150', emptyMilesReduction: '85' },
];

describe('DashboardPage component', () => {
  let cleanup: Function;

  beforeAll(() => {
    cleanup = setupMockServer();
  });

  afterAll(() => {
    cleanup();
  });

  beforeEach(() => {
    mockNavigate.mockClear();

    server.use(
      rest.get('/api/v1/carriers/carrier-123/fleet-summary', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockFleetSummary));
      }),
      rest.get('/api/v1/carriers/carrier-123/loads', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ loads: mockActiveLoads, total: 48 }));
      }),
      rest.get('/api/v1/carriers/carrier-123/analytics/efficiency', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockEfficiencyMetrics));
      }),
      rest.get('/api/v1/carriers/carrier-123/analytics/dashboard', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockRevenueSummary));
      }),
      rest.get('/api/v1/carriers/carrier-123/upcoming-deliveries', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockUpcomingDeliveries));
      }),
      rest.get('/api/v1/carriers/carrier-123/optimization-opportunities', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockOptimizationOpportunities));
      })
    );
  });

  test('renders the dashboard page correctly', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('Dashboard'));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('displays all dashboard cards', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('Fleet Summary'));
    expect(screen.getByText('Fleet Summary')).toBeInTheDocument();
    expect(screen.getByText('Active Loads')).toBeInTheDocument();
    expect(screen.getByText('Efficiency Metrics')).toBeInTheDocument();
    expect(screen.getByText('Revenue Summary')).toBeInTheDocument();
  });

  test('renders the fleet map', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByTitle('Map'));
    const map = screen.getByTitle('Map');
    expect(map).toBeInTheDocument();
    expect(map).toHaveAttribute('height', '400px');
  });

  test('renders the upcoming deliveries table', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('Upcoming Deliveries'));
    expect(screen.getByText('Upcoming Deliveries')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  test('renders the optimization opportunities list', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('Optimization Opportunities'));
    expect(screen.getByText('Optimization Opportunities')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  test('navigates to fleet page when View Fleet is clicked', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('View Fleet'));
    fireEvent.click(screen.getByText('View Fleet'));
    expect(mockNavigate).toHaveBeenCalledWith(CARRIER_PORTAL_ROUTES.FLEET);
  });

  test('navigates to loads page when View Loads is clicked', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('View Loads'));
    fireEvent.click(screen.getByText('View Loads'));
    expect(mockNavigate).toHaveBeenCalledWith(CARRIER_PORTAL_ROUTES.LOADS);
  });

  test('navigates to analytics page when View Details is clicked on Efficiency Metrics', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('View Details'));
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(CARRIER_PORTAL_ROUTES.ANALYTICS);
  });

  test('navigates to financial page when View Financials is clicked', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => screen.getByText('View Financials'));
    fireEvent.click(screen.getByText('View Financials'));
    expect(mockNavigate).toHaveBeenCalledWith(CARRIER_PORTAL_ROUTES.ANALYTICS + '/financial');
  });

  test('displays API data correctly when loaded', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => screen.getByText('Total Trucks'));
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByText('$1,245')).toBeInTheDocument();
  });
});