import { RateService } from '../../src/services/rate.service';
import {
  RateCalculator,
  RateCalculationResult,
  RateTrendAnalysis,
} from '../../src/algorithms/rate-calculator';
import { MarketRate } from '../../src/models/market-rate.model';
import { ExternalMarketDataService } from '../../src/integrations/external-market-data';
import { EquipmentType, Load } from '../../../common/interfaces/load.interface';
import { ErrorCodes } from '../../../common/constants/error-codes';

// Mock the MarketRate class and its methods
jest.mock('../../src/models/market-rate.model', () => {
  return {
    MarketRate: jest.fn().mockImplementation(() => ({
      save: jest.fn(),
    })),
  };
});

// Mock the RateCalculator class and its methods
jest.mock('../../src/algorithms/rate-calculator', () => {
  return {
    RateCalculator: jest.fn().mockImplementation(() => ({
      calculateRate: jest.fn(),
      calculateLoadRate: jest.fn(),
      analyzeRateTrends: jest.fn(),
    })),
  };
});

// Mock the ExternalMarketDataService class and its methods
jest.mock('../../src/integrations/external-market-data', () => {
  return {
    ExternalMarketDataService: jest.fn().mockImplementation(() => ({
      getCurrentMarketRate: jest.fn(),
      getHistoricalRates: jest.fn(),
      getSupplyDemandRatio: jest.fn(),
      getMarketTrends: jest.fn(),
      syncAllMarketRates: jest.fn(),
    })),
  };
});

describe('RateService', () => {
  let rateService: RateService;
  let marketRateMock: jest.Mocked<typeof MarketRate>;
  let rateCalculatorMock: jest.Mocked<RateCalculator>;
  let externalMarketDataServiceMock: jest.Mocked<ExternalMarketDataService>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create new instances of mocked dependencies
    marketRateMock = new (MarketRate as any)() as jest.Mocked<typeof MarketRate>;
    rateCalculatorMock = new (RateCalculator as any)() as jest.Mocked<RateCalculator>;
    externalMarketDataServiceMock = new (ExternalMarketDataService as any)() as jest.Mocked<ExternalMarketDataService>;

    // Create a new instance of RateService with mocked dependencies
    rateService = new RateService();
    (rateService as any).rateCalculator = rateCalculatorMock;
    (rateService as any).externalMarketDataService = externalMarketDataServiceMock;
  });

  it('should be defined', () => {
    // Create a new instance of RateService
    const service = new RateService();

    // Expect the instance to be defined
    expect(service).toBeDefined();
  });

  describe('getMarketRate', () => {
    it('should return market rate data for a lane', async () => {
      // Mock MarketRate.findByLane to return test data
      const mockMarketRate = {
        rate_id: '123',
        origin_region: 'Chicago, IL',
        destination_region: 'Detroit, MI',
        equipment_type: EquipmentType.DRY_VAN,
        average_rate: 950,
        min_rate: 800,
        max_rate: 1100,
        sample_size: 25,
        recorded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      (MarketRate.findByLane as jest.Mock).mockResolvedValue(mockMarketRate);

      // Call rateService.getMarketRate with test parameters
      const result = await rateService.getMarketRate('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN);

      // Expect the result to match the expected market rate data
      expect(result).toEqual({
        rate: 950,
        min: 800,
        max: 1100,
        confidence: 0.8,
      });
    });

    it('should fetch from external service if not in database', async () => {
      // Mock MarketRate.findByLane to return null
      (MarketRate.findByLane as jest.Mock).mockResolvedValue(null);

      // Mock externalMarketDataService.getCurrentMarketRate to return test data
      const mockExternalMarketData = {
        rate: 1000,
        min: 850,
        max: 1150,
        confidence: 0.7,
      };
      (externalMarketDataServiceMock.getCurrentMarketRate as jest.Mock).mockResolvedValue(mockExternalMarketData);

      // Call rateService.getMarketRate with test parameters
      const result = await rateService.getMarketRate('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN);

      // Expect the result to match the external service data
      expect(result).toEqual(mockExternalMarketData);
    });

    it('should throw error for invalid parameters', async () => {
      // Call rateService.getMarketRate with invalid parameters
      await expect(rateService.getMarketRate('', 'Detroit, MI', EquipmentType.DRY_VAN)).rejects.toThrow();
    });
  });

  describe('getHistoricalRates', () => {
    it('should return historical rate data', async () => {
      // Mock MarketRate.findHistoricalRates to return test data
      const mockHistoricalRates = [
        { rate: 900, date: new Date('2023-01-01') },
        { rate: 950, date: new Date('2023-01-08') },
        { rate: 1000, date: new Date('2023-01-15') },
      ];
      (MarketRate.findHistoricalRates as jest.Mock).mockResolvedValue(mockHistoricalRates);

      // Call rateService.getHistoricalRates with test parameters
      const result = await rateService.getHistoricalRates('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN, new Date('2023-01-01'), new Date('2023-01-15'));

      // Expect the result to match the expected historical rate data
      expect(result).toEqual(mockHistoricalRates);
    });

    it('should fetch from external service if insufficient data', async () => {
      // Mock MarketRate.findHistoricalRates to return limited data
      (MarketRate.findHistoricalRates as jest.Mock).mockResolvedValue([
        { rate: 900, date: new Date('2023-01-01') },
      ]);

      // Mock externalMarketDataService.getHistoricalRates to return additional data
      const mockExternalHistoricalRates = [
        { rate: 950, date: new Date('2023-01-08') },
        { rate: 1000, date: new Date('2023-01-15') },
      ];
      (externalMarketDataServiceMock.getHistoricalRates as jest.Mock).mockResolvedValue(mockExternalHistoricalRates);

      // Call rateService.getHistoricalRates with test parameters
      const result = await rateService.getHistoricalRates('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN, new Date('2023-01-01'), new Date('2023-01-15'));

      // Expect the result to include both internal and external data
      expect(result).toEqual([
        { rate: 900, date: new Date('2023-01-01') },
        { rate: 950, date: new Date('2023-01-08') },
        { rate: 1000, date: new Date('2023-01-15') },
      ]);
    });
  });

  describe('calculateRate', () => {
    it('should return rate calculation result', async () => {
      // Mock rateCalculator.calculateRate to return test calculation result
      const mockCalculationResult: RateCalculationResult = {
        totalRate: 1000,
        mileageRate: 3.29,
        baseRate: 800,
        adjustmentFactor: 0.2,
        factors: {
          baseRate: 0.4,
          supplyDemand: 0.25,
          historicalTrend: 0.15,
          urgency: 0.1,
          networkOptimization: 0.1,
        },
        confidence: 0.8,
        calculatedAt: new Date(),
      };
      (rateCalculatorMock.calculateRate as jest.Mock).mockResolvedValue(mockCalculationResult);

      // Call rateService.calculateRate with test parameters
      const result = await rateService.calculateRate('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN, {});

      // Expect the result to match the expected calculation result
      expect(result).toEqual(mockCalculationResult);
    });
  });

  describe('calculateLoadRate', () => {
    it('should return rate for a specific load', async () => {
      // Create a mock load object
      const mockLoad: Load = createMockLoad({
        load_id: 'load123',
        equipment_type: EquipmentType.DRY_VAN,
      });

      // Mock rateCalculator.calculateLoadRate to return test calculation result
      const mockCalculationResult: RateCalculationResult = {
        totalRate: 1000,
        mileageRate: 3.29,
        baseRate: 800,
        adjustmentFactor: 0.2,
        factors: {
          baseRate: 0.4,
          supplyDemand: 0.25,
          historicalTrend: 0.15,
          urgency: 0.1,
          networkOptimization: 0.1,
        },
        confidence: 0.8,
        calculatedAt: new Date(),
      };
      (rateCalculatorMock.calculateLoadRate as jest.Mock).mockResolvedValue(mockCalculationResult);

      // Call rateService.calculateLoadRate with the mock load
      const result = await rateService.calculateLoadRate(mockLoad);

      // Expect the result to match the expected calculation result
      expect(result).toEqual(mockCalculationResult);
    });
  });

  describe('analyzeRateTrends', () => {
    it('should return trend analysis', async () => {
      // Mock rateCalculator.analyzeRateTrends to return test trend analysis
      const mockTrendAnalysis: RateTrendAnalysis = {
        averageRate: 950,
        minRate: 800,
        maxRate: 1100,
        volatility: 0.1,
        trend: 'stable',
        forecast: [],
        confidence: 0.8,
        dataPoints: 30,
      };
      (rateCalculatorMock.analyzeRateTrends as jest.Mock).mockResolvedValue(mockTrendAnalysis);

      // Call rateService.analyzeRateTrends with test parameters
      const result = await rateService.analyzeRateTrends('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN, 30);

      // Expect the result to match the expected trend analysis
      expect(result).toEqual(mockTrendAnalysis);
    });
  });

  describe('getSupplyDemandRatio', () => {
    it('should return ratio data', async () => {
      // Mock externalMarketDataService.getSupplyDemandRatio to return test ratio data
      const mockSupplyDemandRatio = {
        ratio: 0.8,
        confidence: 0.7,
      };
      (externalMarketDataServiceMock.getSupplyDemandRatio as jest.Mock).mockResolvedValue(mockSupplyDemandRatio);

      // Call rateService.getSupplyDemandRatio with test parameters
      const result = await rateService.getSupplyDemandRatio('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN);

      // Expect the result to match the expected ratio data
      expect(result).toEqual(mockSupplyDemandRatio);
    });
  });

  describe('calculateRateAdjustment', () => {
    it('should return adjustment factor', async () => {
      // Mock necessary dependencies
      (MarketRate.findByLane as jest.Mock).mockResolvedValue({ average_rate: 1000 });
      (externalMarketDataServiceMock.getSupplyDemandRatio as jest.Mock).mockResolvedValue({ ratio: 0.8, confidence: 0.7 });

      // Call rateService.calculateRateAdjustment with test parameters
      const result = await rateService.calculateRateAdjustment('Chicago, IL', 'Detroit, MI', EquipmentType.DRY_VAN, {});

      // Expect the result to include adjustment factor and confidence score
      expect(result).toBeDefined();
      expect(result.adjustmentFactor).toBeCloseTo(-0.022, 3);
      expect(result.confidence).toBe(0.7);
    });
  });

  describe('syncMarketRates', () => {
    it('should synchronize rates from external sources', async () => {
      // Mock externalMarketDataService.syncAllMarketRates to return test data
      (externalMarketDataServiceMock.syncAllMarketRates as jest.Mock).mockResolvedValue({ success: true, count: 3 });

      // Call rateService.syncMarketRates
      const result = await rateService.syncMarketRates();

      // Expect the result to include success status and count of synchronized rates
      expect(result).toEqual({ success: true, count: 3 });
    });
  });

  describe('createMarketRate', () => {
    it('should create a new market rate record', async () => {
      // Create mock rate data
      const mockRateData = {
        origin_region: 'Chicago, IL',
        destination_region: 'Detroit, MI',
        equipment_type: EquipmentType.DRY_VAN,
        average_rate: 950,
        min_rate: 800,
        max_rate: 1100,
        sample_size: 25,
        recorded_at: new Date(),
      };

      // Mock MarketRate.save to return saved data
      (marketRateMock.save as jest.Mock).mockResolvedValue(mockRateData);

      // Call rateService.createMarketRate with mock data
      const result = await rateService.createMarketRate(mockRateData);

      // Expect the result to match the saved market rate
      expect(result).toEqual(mockRateData);
    });
  });

  describe('updateMarketRate', () => {
    it('should update an existing market rate record', async () => {
      // Create mock rate data and ID
      const mockRateId = '123';
      const mockRateData = {
        average_rate: 1000,
      };

      // Mock MarketRate.findById to return existing rate
      (MarketRate.findById as jest.Mock).mockResolvedValue({
        rate_id: mockRateId,
        origin_region: 'Chicago, IL',
        destination_region: 'Detroit, MI',
        equipment_type: EquipmentType.DRY_VAN,
        average_rate: 950,
        save: jest.fn().mockResolvedValue(undefined),
      });

      // Mock MarketRate.save to return updated data
      (marketRateMock.save as jest.Mock).mockResolvedValue(mockRateData);

      // Call rateService.updateMarketRate with ID and mock data
      const result = await rateService.updateMarketRate(mockRateId, mockRateData);

      // Expect the result to match the updated market rate
      expect(result).toEqual(mockRateData);
    });

    it('should throw error if rate not found', async () => {
      // Mock MarketRate.findById to return null
      (MarketRate.findById as jest.Mock).mockResolvedValue(null);

      // Call rateService.updateMarketRate with ID and mock data
      await expect(rateService.updateMarketRate('123', {})).rejects.toThrow();
    });
  });

  describe('getMarketRates', () => {
    it('should return filtered market rates', async () => {
      // Create mock filter and pagination parameters
      const mockFilters = { originRegion: 'Chicago, IL' };
      const mockPagination = { page: 1, limit: 10 };

      // Mock MarketRate.findAll to return test data and count
      const mockRates = [
        { rate_id: '1', origin_region: 'Chicago, IL', destination_region: 'Detroit, MI', equipment_type: EquipmentType.DRY_VAN, average_rate: 950 },
        { rate_id: '2', origin_region: 'Chicago, IL', destination_region: 'Indianapolis, IN', equipment_type: EquipmentType.REFRIGERATED, average_rate: 1200 },
      ];
      (MarketRate.findAll as jest.Mock).mockResolvedValue({ rates: mockRates, total: 2 });

      // Call rateService.getMarketRates with filter and pagination
      const result = await rateService.getMarketRates(mockFilters, mockPagination);

      // Expect the result to include rates array and total count
      expect(result).toEqual({ rates: mockRates, total: 2 });
    });
  });

  describe('validateRegion', () => {
    it('should validate region names', () => {
      // Call rateService.validateRegion with valid region name
      expect(rateService.validateRegion('Chicago, IL')).toBe(true);

      // Call rateService.validateRegion with invalid region name
      expect(rateService.validateRegion('Chicago, IL!')).toBe(false);
    });
  });

  describe('normalizeRegion', () => {
    it('should standardize region names', () => {
      // Call rateService.normalizeRegion with different region formats
      expect(rateService.normalizeRegion('saint louis')).toBe('SAINT LOUIS');
      expect(rateService.normalizeRegion('  new york  ')).toBe('NEW YORK');
      expect(rateService.normalizeRegion('los angeles, ca')).toBe('LOS ANGELES CA');
    });
  });
});

function createMockMarketRate(overrides: Partial<MarketRate> = {}): MarketRate {
  // Create a default market rate object with test values
  const defaultMarketRate = {
    rate_id: 'mockRateId',
    origin_region: 'MockOrigin',
    destination_region: 'MockDestination',
    equipment_type: EquipmentType.DRY_VAN,
    average_rate: 1000,
    min_rate: 800,
    max_rate: 1200,
    sample_size: 20,
    recorded_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  // Override default values with any provided overrides
  const mockMarketRate = { ...defaultMarketRate, ...overrides };

  // Return the mock market rate object
  return mockMarketRate as MarketRate;
}

function createMockLoad(overrides: Partial<Load> = {}): Load {
  // Create a default load object with test values
  const defaultLoad: Load = {
    load_id: 'mockLoadId',
    shipper_id: 'mockShipperId',
    reference_number: 'mockReferenceNumber',
    description: 'Mock Load Description',
    equipment_type: EquipmentType.DRY_VAN,
    weight: 40000,
    dimensions: { length: 53, width: 8.5, height: 8.5 },
    volume: 3000,
    pallets: 20,
    commodity: 'Mock Commodity',
    status: 'AVAILABLE',
    pickup_earliest: new Date(),
    pickup_latest: new Date(),
    delivery_earliest: new Date(),
    delivery_latest: new Date(),
    offered_rate: 1200,
    special_instructions: 'Handle with care',
    is_hazardous: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Include origin and destination locations
  const originLocation = {
    location_id: 'origin123',
    load_id: 'mockLoadId',
    location_type: 'PICKUP',
    facility_name: 'Origin Facility',
    address: '123 Mock Street',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    latitude: 41.8781,
    longitude: -87.6298,
    earliest_time: new Date(),
    latest_time: new Date(),
    contact_name: 'John Doe',
    contact_phone: '555-123-4567',
    special_instructions: 'Call before arrival',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const destinationLocation = {
    location_id: 'destination456',
    load_id: 'mockLoadId',
    location_type: 'DELIVERY',
    facility_name: 'Destination Facility',
    address: '456 Mock Avenue',
    city: 'Detroit',
    state: 'MI',
    zip: '48201',
    latitude: 42.3314,
    longitude: -83.0458,
    earliest_time: new Date(),
    latest_time: new Date(),
    contact_name: 'Jane Smith',
    contact_phone: '555-987-6543',
    special_instructions: 'Use dock door 5',
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Override default values with any provided overrides
  const mockLoad = { ...defaultLoad, ...overrides, locations: [originLocation, destinationLocation] };

  // Return the mock load object
  return mockLoad as Load;
}