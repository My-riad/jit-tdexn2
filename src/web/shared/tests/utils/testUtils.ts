import { screen, waitFor, fireEvent, act } from '@testing-library/react'; // version ^14.0.0
import { userEvent } from '@testing-library/user-event'; // version ^14.4.3
import { rest } from 'msw'; // version ^1.2.1
import { renderWithProviders } from './renderWithProviders';
import server from '../mocks/server';

/**
 * Options for creating mock data
 */
interface MockOptions {
  /**
   * Whether to include default values
   * @default true
   */
  withDefaults?: boolean;
}

/**
 * Waits for an element to be removed from the DOM with a custom timeout
 * @param callback () => HTMLElement | null
 * @param options { timeout?: number }
 * @returns Promise<void> Resolves when the element is removed
 */
export const waitForElementToBeRemoved = (
  callback: () => HTMLElement | null,
  options: { timeout?: number } = {}
): Promise<void> => {
  const timeout = options.timeout || 5000;

  return waitFor(() => {
    expect(callback()).toBeNull();
  }, { timeout });
};

/**
 * Mocks an API response for a specific endpoint and method
 * @param method string
 * @param url string | RegExp
 * @param response any
 * @param status number
 * @returns void No return value
 */
export const mockApiResponse = (
  method: string,
  url: string | RegExp,
  response: any,
  status: number = 200
): void => {
  server.use(
    rest[method.toLowerCase()](url, (req, res, ctx) => {
      return res(ctx.status(status), ctx.json(response));
    })
  );
};

/**
 * Mocks an API error response for a specific endpoint
 * @param method string
 * @param url string | RegExp
 * @param errorMessage string
 * @param status number
 * @returns void No return value
 */
export const mockApiError = (
  method: string,
  url: string | RegExp,
  errorMessage: string,
  status: number = 500
): void => {
  server.use(
    rest[method.toLowerCase()](url, (req, res, ctx) => {
      return res(
        ctx.status(status),
        ctx.json({ message: errorMessage })
      );
    })
  );
};

/**
 * Creates a mock driver object for testing
 * @param overrides Partial<Driver>
 * @returns Driver A mock driver object
 */
export const createMockDriver = (overrides: Partial<Driver> = {}): Driver => {
  const defaultDriver: Driver = {
    id: 'driver-123',
    userId: 'user-123',
    carrierId: 'carrier-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    licenseNumber: 'DL12345678',
    licenseState: 'TX',
    licenseClass: 'CLASS_A',
    licenseEndorsements: ['HAZMAT', 'TANKER'],
    licenseExpiration: '2025-06-30',
    homeAddress: {
      street1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA',
    },
    currentLocation: {
      latitude: 30.2672,
      longitude: -97.7431,
    },
    currentVehicleId: 'vehicle-123',
    currentLoadId: 'load-123',
    status: 'AVAILABLE',
    hosStatus: 'OFF_DUTY',
    hosStatusSince: '2023-05-15T08:00:00Z',
    drivingMinutesRemaining: 600,
    dutyMinutesRemaining: 840,
    cycleMinutesRemaining: 3600,
    efficiencyScore: 87,
    eldDeviceId: 'eld-123',
    eldProvider: 'KeepTruckin',
    createdAt: '2023-01-15T12:00:00Z',
    updatedAt: '2023-05-15T08:00:00Z',
    active: true,
  };

  return { ...defaultDriver, ...overrides };
};

/**
 * Creates a mock load object for testing
 * @param overrides Partial<Load>
 * @returns Load A mock load object
 */
export const createMockLoad = (overrides: Partial<Load> = {}): Load => {
  const defaultLoad: Load = {
    id: 'load-123',
    shipperId: 'shipper-123',
    referenceNumber: 'REF-12345',
    description: 'Pallets of electronics',
    equipmentType: 'DRY_VAN',
    weight: 42000,
    dimensions: {
      length: 48,
      width: 8.5,
      height: 8.5,
    },
    volume: 3400,
    pallets: 24,
    commodity: 'Electronics',
    status: 'AVAILABLE',
    pickupEarliest: '2023-05-16T08:00:00Z',
    pickupLatest: '2023-05-16T12:00:00Z',
    deliveryEarliest: '2023-05-17T08:00:00Z',
    deliveryLatest: '2023-05-17T16:00:00Z',
    offeredRate: 950,
    specialInstructions: 'Dock high only. Appointment required.',
    isHazardous: false,
    temperatureRequirements: null,
    createdAt: '2023-05-15T10:00:00Z',
    updatedAt: '2023-05-15T10:00:00Z',
  };

  return { ...defaultLoad, ...overrides };
};

/**
 * Creates a mock driver score object for testing
 * @param overrides Partial<DriverScore>
 * @returns DriverScore A mock driver score object
 */
export const createMockScore = (overrides: Partial<DriverScore> = {}): DriverScore => {
  const defaultScore: DriverScore = {
    id: 'score-123',
    driverId: 'driver-123',
    totalScore: 87,
    emptyMilesScore: 92,
    networkContributionScore: 85,
    onTimeScore: 90,
    hubUtilizationScore: 78,
    fuelEfficiencyScore: 88,
    scoreFactors: {
      consistent_delivery: 5,
      backhaul_utilization: 3,
      peak_time_availability: 2,
    },
    calculatedAt: '2023-05-15T10:00:00Z',
  };

  return { ...defaultScore, ...overrides };
};

/**
 * Simulates a delay in test execution
 * @param ms number
 * @returns Promise<void> Resolves after the specified delay
 */
export const simulateDelay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Resets all API mocks to their default handlers
 * @returns void No return value
 */
export const resetApiMocks = (): void => {
  server.resetHandlers();
};

// IE3: Re-export the renderWithProviders utility for convenience
export { renderWithProviders };