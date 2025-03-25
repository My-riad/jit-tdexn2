import React from 'react'; // React core library for UI components // version ^18.2.0
import { screen, waitFor } from '@testing-library/react'; // Testing library utilities for querying and waiting for elements // version ^14.0.0
import { userEvent } from '@testing-library/user-event'; // User event simulation for testing interactions // version ^14.4.3

import DashboardPage from '../../src/pages/DashboardPage'; // Import the component being tested
import { renderWithProviders, setupMockServer } from '../../../shared/tests/utils/renderWithProviders'; // Import testing utilities for rendering components with providers and setting up mock server
import { mockApiResponse, createMockLoad } from '../../../shared/tests/utils/testUtils'; // Import utilities for mocking API responses and creating test data
import { SHIPPER_PORTAL_ROUTES } from '../../../common/constants/routes'; // Import route constants for testing navigation
import { LOAD_ENDPOINTS, MARKET_ENDPOINTS } from '../../../common/constants/endpoints'; // Import API endpoint constants for mocking API calls

describe('DashboardPage', () => {
  // Set up the mock server for API requests
  const mockServer = setupMockServer();

  beforeAll(() => {
    mockServer.listen();
  });

  afterAll(() => {
    mockServer.close();
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  const mockLoadSummary = {
    totalActive: 24,
    pending: 6,
    completedToday: 8,
    issues: 1,
  };

  const mockActiveShipments = {
    inTransit: 18,
    atPickup: 3,
    atDelivery: 3,
  };

  const mockOptimizationSavings = {
    thisWeek: 3450,
    thisMonth: 12780,
    ytd: 54320,
  };

  const mockCarrierPerformance = {
    onTimeDelivery: 96,
    avgCarrierScore: 88,
    issueRate: 1.2,
  };

  const mockUpcomingDeliveries = [
    { id: 'LD-5678', carrier: 'ABC Trucking', destination: 'Chicago, IL', status: 'In Transit', eta: '2023-05-15T10:30:00Z' },
    { id: 'LD-5679', carrier: 'XYZ Logistics', destination: 'Detroit, MI', status: 'In Transit', eta: '2023-05-15T11:45:00Z' },
    { id: 'LD-5680', carrier: 'Fast Freight', destination: 'Cleveland, OH', status: 'In Transit', eta: '2023-05-15T13:15:00Z' },
  ];

  const mockMarketInsights = [
    { id: 'MI-001', type: 'rate_trend', message: 'Rates trending 5% higher on Chicago → Detroit lane', recommendation: 'Consider booking capacity early for next week' },
    { id: 'MI-002', type: 'capacity_alert', message: 'Capacity shortage predicted for Northeast region in 48-72 hours', recommendation: 'due to weather event' },
    { id: 'MI-003', type: 'optimization_opportunity', message: 'Consolidate 3 LTL shipments to Cleveland', recommendation: 'Potential savings: $850' },
  ];

  const mockNavigate = jest.fn();

  test('renders the dashboard page with all components', () => {
    mockApiResponse('get', LOAD_ENDPOINTS.SUMMARY, mockLoadSummary);
    mockApiResponse('get', LOAD_ENDPOINTS.ACTIVE_SHIPMENTS, mockActiveShipments);
    mockApiResponse('get', MARKET_ENDPOINTS.INSIGHTS, mockMarketInsights);

    const { container } = renderWithProviders(<DashboardPage />, {
      store: {
        getState: () => ({
          auth: {
            authState: {
              user: {
                shipperId: 'shipper-123'
              }
            }
          },
          loads: {
            loads: [
              createMockLoad({ id: 'load-1' }),
              createMockLoad({ id: 'load-2' }),
            ],
          },
        }),
      },
      routerMock: {
        useNavigate: () => mockNavigate,
      },
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create Load')).toBeInTheDocument();
    expect(screen.getByText('Total Loads')).toBeInTheDocument();
    expect(screen.getByText('Active Shipments')).toBeInTheDocument();
    expect(screen.getByText('Market Insights')).toBeInTheDocument();
  });

  test('navigates to create load page when Create Load button is clicked', async () => {
    mockApiResponse('get', LOAD_ENDPOINTS.SUMMARY, mockLoadSummary);
    mockApiResponse('get', LOAD_ENDPOINTS.ACTIVE_SHIPMENTS, mockActiveShipments);
    mockApiResponse('get', MARKET_ENDPOINTS.INSIGHTS, mockMarketInsights);

    renderWithProviders(<DashboardPage />, {
      routerMock: {
        useNavigate: () => mockNavigate,
      },
    });

    const createLoadButton = screen.getByText('Create Load');
    await userEvent.click(createLoadButton);

    expect(mockNavigate).toHaveBeenCalledWith(SHIPPER_PORTAL_ROUTES.CREATE_LOAD);
  });

  test('navigates to loads page when View All Deliveries is clicked', async () => {
    mockApiResponse('get', LOAD_ENDPOINTS.SUMMARY, mockLoadSummary);
    mockApiResponse('get', LOAD_ENDPOINTS.ACTIVE_SHIPMENTS, mockActiveShipments);
    mockApiResponse('get', MARKET_ENDPOINTS.INSIGHTS, mockMarketInsights);

    renderWithProviders(<DashboardPage />, {
      routerMock: {
        useNavigate: () => mockNavigate,
      },
    });

    const viewAllLink = screen.getByText('View All');
    await userEvent.click(viewAllLink);

    expect(mockNavigate).toHaveBeenCalledWith(SHIPPER_PORTAL_ROUTES.LOADS);
  });

  test('navigates to analytics page when View All Insights is clicked', async () => {
    mockApiResponse('get', LOAD_ENDPOINTS.SUMMARY, mockLoadSummary);
    mockApiResponse('get', LOAD_ENDPOINTS.ACTIVE_SHIPMENTS, mockActiveShipments);
    mockApiResponse('get', MARKET_ENDPOINTS.INSIGHTS, mockMarketInsights);

    renderWithProviders(<DashboardPage />, {
      store: {
        getState: () => ({
          auth: {
            authState: {
              user: {
                shipperId: 'shipper-123'
              }
            }
          }
        }),
      },
      routerMock: {
        useNavigate: () => mockNavigate,
      },
    });

    const viewAllLink = screen.getByText('View All');
    await userEvent.click(viewAllLink);

    expect(mockNavigate).toHaveBeenCalledWith(SHIPPER_PORTAL_ROUTES.ANALYTICS);
  });

  test('displays loading state while fetching data', async () => {
    mockApiResponse('get', LOAD_ENDPOINTS.SUMMARY, mockLoadSummary, 200);
    mockApiResponse('get', LOAD_ENDPOINTS.ACTIVE_SHIPMENTS, mockActiveShipments, 200);
    mockApiResponse('get', MARKET_ENDPOINTS.INSIGHTS, mockMarketInsights, 200);

    mockServer.use(
      rest.get(LOAD_ENDPOINTS.SUMMARY, async (req, res, ctx) => {
        await simulateDelay(100);
        return res(ctx.status(200), ctx.json(mockLoadSummary));
      }),
      rest.get(LOAD_ENDPOINTS.ACTIVE_SHIPMENTS, async (req, res, ctx) => {
        await simulateDelay(100);
        return res(ctx.status(200), ctx.json(mockActiveShipments));
      }),
      rest.get(MARKET_ENDPOINTS.INSIGHTS, async (req, res, ctx) => {
        await simulateDelay(100);
        return res(ctx.status(200), ctx.json(mockMarketInsights));
      })
    );

    renderWithProviders(<DashboardPage />, {
      store: {
        getState: () => ({
          auth: {
            authState: {
              user: {
                shipperId: 'shipper-123'
              }
            }
          },
          loads: {
            loads: [],
          },
        }),
      },
    });

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('displays error state when API requests fail', async () => {
    mockApiError('get', LOAD_ENDPOINTS.SUMMARY, 'Error loading data');
    mockApiError('get', LOAD_ENDPOINTS.ACTIVE_SHIPMENTS, 'Error loading data');
    mockApiError('get', MARKET_ENDPOINTS.INSIGHTS, 'Error loading data');

    renderWithProviders(<DashboardPage />, {
      store: {
        getState: () => ({
          auth: {
            authState: {
              user: {
                shipperId: 'shipper-123'
              }
            }
          },
          loads: {
            loads: [],
          },
        }),
      },
    });

    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);

    // Add assertion to check if the API request is attempted again
  });
});