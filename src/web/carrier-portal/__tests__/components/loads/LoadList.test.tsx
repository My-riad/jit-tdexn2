import React from 'react'; // react ^17.0.2
import { screen, waitFor, fireEvent, within } from '@testing-library/react'; // @testing-library/react ^14.0.0
import { userEvent } from '@testing-library/user-event'; // @testing-library/user-event ^14.4.3

import LoadList from '../../../src/components/loads/LoadList';
import { renderWithProviders, setupMockServer } from '../../../shared/tests/utils/renderWithProviders';
import { mockApiResponse, mockApiError, createMockLoad, resetApiMocks } from '../../../shared/tests/utils/testUtils';
import { LOAD_ENDPOINTS } from '../../../common/constants/endpoints';
import { LoadStatus, EquipmentType, Load } from '../../../common/interfaces/load.interface';

/**
 * Helper function to create an array of mock loads for testing
 * @param count number
 * @returns Array<Load> Array of mock load objects
 */
const createMockLoadList = (count: number): Load[] => {
  const loads: Load[] = Array.from({ length: count }, (_, index) => {
    const load = createMockLoad();
    return {
      ...load,
      id: `load-${index + 1}`,
      referenceNumber: `REF-${index + 1}`,
      status: Object.values(LoadStatus)[index % Object.values(LoadStatus).length],
    };
  });
  return loads;
};

/**
 * Helper function to set up common test environment for LoadList tests
 * @param options { initialLoads?: Array<Load>, carrierId?: string, error?: boolean }
 * @returns object Object containing render result and utility functions
 */
const setupLoadListTest = (options: { initialLoads?: Array<Load>, carrierId?: string, error?: boolean } = {}) => {
  const { initialLoads, carrierId = 'carrier-123', error } = options;
  const mockLoads = initialLoads || createMockLoadList(3);

  if (error) {
    mockApiError('get', LOAD_ENDPOINTS.SEARCH, 'Failed to fetch loads');
  } else {
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: mockLoads, total: mockLoads.length, page: 1, limit: 10 });
  }

  const renderResult = renderWithProviders(<LoadList carrierId={carrierId} />);

  return {
    ...renderResult,
    mockLoads,
  };
};

describe('LoadList Component', () => {
  let cleanupMockServer: Function;

  beforeAll(() => {
    cleanupMockServer = setupMockServer();
  });

  afterEach(() => {
    resetApiMocks();
  });

  afterAll(() => {
    cleanupMockServer();
  });

  it('renders the load list with data', async () => {
    const { mockLoads } = setupLoadListTest();
    await waitFor(() => {
      expect(screen.getByText(mockLoads[0].referenceNumber)).toBeInTheDocument();
    });

    expect(screen.getAllByRole('row').length).toBe(mockLoads.length + 1);
    mockLoads.forEach(load => {
      expect(screen.getByText(load.referenceNumber)).toBeInTheDocument();
      expect(screen.getByText(load.id)).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching data', async () => {
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: [], total: 0, page: 1, limit: 10 }, 200, 2000);
    const { findByRole } = renderWithProviders(<LoadList carrierId="carrier-123" />);
    expect(await findByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  it('displays error message when API fails', async () => {
    setupLoadListTest({ error: true });
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch loads')).toBeInTheDocument();
    });
  });

  it('filters loads by search query', async () => {
    const { mockLoads } = setupLoadListTest();
    const searchQuery = mockLoads[0].referenceNumber;
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: [mockLoads[0]], total: 1, page: 1, limit: 10 });

    const searchInput = screen.getByPlaceholderText('Search loads...');
    fireEvent.change(searchInput, { target: { value: searchQuery } });

    await waitFor(() => {
      expect(screen.getByText(searchQuery)).toBeInTheDocument();
      expect(screen.queryByText(mockLoads[1].referenceNumber)).not.toBeInTheDocument();
    });
  });

  it('filters loads by status', async () => {
    const { mockLoads } = setupLoadListTest();
    const status = mockLoads[0].status;
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: [mockLoads[0]], total: 1, page: 1, limit: 10 });

    const statusFilter = screen.getByLabelText('Status:');
    fireEvent.change(statusFilter, { target: { value: status } });

    await waitFor(() => {
      expect(screen.getByText(mockLoads[0].referenceNumber)).toBeInTheDocument();
      expect(screen.queryByText(mockLoads[1].referenceNumber)).not.toBeInTheDocument();
    });
  });

  it('filters loads by equipment type', async () => {
    const { mockLoads } = setupLoadListTest();
    const equipmentType = mockLoads[0].equipmentType;
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: [mockLoads[0]], total: 1, page: 1, limit: 10 });

    const equipmentFilter = screen.getByLabelText('Equipment:');
    fireEvent.change(equipmentFilter, { target: { value: equipmentType } });

    await waitFor(() => {
      expect(screen.getByText(mockLoads[0].referenceNumber)).toBeInTheDocument();
      expect(screen.queryByText(mockLoads[1].referenceNumber)).not.toBeInTheDocument();
    });
  });

  it('filters loads by date range', async () => {
    const { mockLoads } = setupLoadListTest();
    const pickupDate = '2023-05-16';
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: [mockLoads[0]], total: 1, page: 1, limit: 10 });

    const datePicker = screen.getByPlaceholderText('Select date...');
    fireEvent.focus(datePicker);
    fireEvent.change(datePicker, { target: { value: pickupDate } });
    fireEvent.blur(datePicker);

    await waitFor(() => {
      expect(screen.getByText(mockLoads[0].referenceNumber)).toBeInTheDocument();
      expect(screen.queryByText(mockLoads[1].referenceNumber)).not.toBeInTheDocument();
    });
  });

  it('sorts loads by column', async () => {
    const { mockLoads } = setupLoadListTest();
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: [...mockLoads].sort((a, b) => a.weight - b.weight), total: mockLoads.length, page: 1, limit: 10 });
    const weightHeader = screen.getByText('Weight');
    fireEvent.click(weightHeader);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent(mockLoads[0].referenceNumber);
    });

    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: [...mockLoads].sort((a, b) => b.weight - a.weight), total: mockLoads.length, page: 1, limit: 10 });
    fireEvent.click(weightHeader);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent(mockLoads[1].referenceNumber);
    });
  });

  it('paginates through loads', async () => {
    const { mockLoads } = setupLoadListTest();
    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: mockLoads.slice(0, 1), total: mockLoads.length, page: 1, limit: 1 });
    await waitFor(() => {
      expect(screen.getByText(mockLoads[0].referenceNumber)).toBeInTheDocument();
    });

    mockApiResponse('get', LOAD_ENDPOINTS.SEARCH, { data: mockLoads.slice(1, 2), total: mockLoads.length, page: 2, limit: 1 });
    const nextPageButton = screen.getByRole('button', { name: /Next page/i });
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(screen.getByText(mockLoads[1].referenceNumber)).toBeInTheDocument();
      expect(screen.queryByText(mockLoads[0].referenceNumber)).not.toBeInTheDocument();
    });
  });

  it('opens load detail modal when row is clicked', async () => {
    const { mockLoads } = setupLoadListTest();
    await waitFor(() => {
      expect(screen.getByText(mockLoads[0].referenceNumber)).toBeInTheDocument();
    });

    const row = screen.getByRole('row', { name: new RegExp(mockLoads[0].referenceNumber) });
    fireEvent.click(row);

    await waitFor(() => {
      expect(screen.getByText('Load Details')).toBeInTheDocument();
      expect(screen.getByText(`Load ID: ${mockLoads[0].id}`)).toBeInTheDocument();
    });
  });
});