import { rest } from 'msw';
import {
  AUTH_ENDPOINTS,
  DRIVER_ENDPOINTS,
  LOAD_ENDPOINTS,
  GAMIFICATION_ENDPOINTS,
  TRACKING_ENDPOINTS,
  MARKET_ENDPOINTS
} from '../../common/constants/endpoints';
import { LoginResponse, AuthUser } from '../../common/interfaces/auth.interface';
import { Driver, DriverWithDetails } from '../../common/interfaces/driver.interface';
import { Load, LoadWithDetails } from '../../common/interfaces/load.interface';
import { 
  DriverScore, 
  Achievement, 
  Leaderboard, 
  LeaderboardEntry, 
  BonusZone 
} from '../../common/interfaces/gamification.interface';

/**
 * Mock Service Worker handlers for intercepting and mocking API requests
 * Used for testing frontend components in isolation
 */
const handlers = [
  // Authentication Handlers
  rest.post(AUTH_ENDPOINTS.LOGIN, async (req, res, ctx) => {
    const credentials = await req.json();
    
    // Mock login response
    const loginResponse: LoginResponse = {
      user: {
        id: 'user-123',
        email: credentials.email || 'driver@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'DRIVER',
        roles: ['driver'],
        permissions: ['view_loads', 'accept_loads'],
        carrierId: 'carrier-123',
        shipperId: null,
        driverId: 'driver-123',
        mfaEnabled: false,
        profileImageUrl: null
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      },
      mfaRequired: false
    };
    
    return res(ctx.status(200), ctx.json(loginResponse));
  }),
  
  rest.get(AUTH_ENDPOINTS.CURRENT_USER, (req, res, ctx) => {
    // Mock current user response
    const user: AuthUser = {
      id: 'user-123',
      email: 'driver@example.com',
      firstName: 'John',
      lastName: 'Doe',
      userType: 'DRIVER',
      roles: ['driver'],
      permissions: ['view_loads', 'accept_loads'],
      carrierId: 'carrier-123',
      shipperId: null,
      driverId: 'driver-123',
      mfaEnabled: false,
      profileImageUrl: null
    };
    
    return res(ctx.status(200), ctx.json(user));
  }),
  
  rest.post(AUTH_ENDPOINTS.REFRESH_TOKEN, (req, res, ctx) => {
    // Mock refresh token response
    const tokens = {
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresIn: 3600
    };
    
    return res(ctx.status(200), ctx.json(tokens));
  }),
  
  rest.post(AUTH_ENDPOINTS.LOGOUT, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Logged out successfully' }));
  }),
  
  // Driver Handlers
  rest.get(DRIVER_ENDPOINTS.GET_BY_ID, (req, res, ctx) => {
    const { driverId } = req.params;
    
    // Mock driver data
    const driver: Driver = {
      id: driverId as string,
      userId: 'user-123',
      carrierId: 'carrier-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'driver@example.com',
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
        country: 'USA'
      },
      currentLocation: {
        latitude: 30.2672,
        longitude: -97.7431
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
      active: true
    };
    
    return res(ctx.status(200), ctx.json(driver));
  }),
  
  rest.get(DRIVER_ENDPOINTS.BASE, (req, res, ctx) => {
    // Get query parameters for pagination and filtering
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Mock list of drivers
    const drivers: Driver[] = [
      {
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
          country: 'USA'
        },
        currentLocation: {
          latitude: 30.2672,
          longitude: -97.7431
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
        active: true
      },
      {
        id: 'driver-124',
        userId: 'user-124',
        carrierId: 'carrier-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-987-6543',
        licenseNumber: 'DL87654321',
        licenseState: 'CA',
        licenseClass: 'CLASS_A',
        licenseEndorsements: ['DOUBLE_TRIPLE'],
        licenseExpiration: '2024-08-15',
        homeAddress: {
          street1: '456 Oak St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94107',
          country: 'USA'
        },
        currentLocation: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        currentVehicleId: 'vehicle-124',
        currentLoadId: 'load-124',
        status: 'DRIVING',
        hosStatus: 'DRIVING',
        hosStatusSince: '2023-05-15T10:00:00Z',
        drivingMinutesRemaining: 480,
        dutyMinutesRemaining: 720,
        cycleMinutesRemaining: 3240,
        efficiencyScore: 92,
        eldDeviceId: 'eld-124',
        eldProvider: 'KeepTruckin',
        createdAt: '2023-02-10T12:00:00Z',
        updatedAt: '2023-05-15T10:00:00Z',
        active: true
      }
    ];
    
    // Pagination data
    const pagination = {
      total: 2,
      page,
      limit,
      totalPages: 1
    };
    
    return res(ctx.status(200), ctx.json({ data: drivers, ...pagination }));
  }),
  
  rest.get(DRIVER_ENDPOINTS.AVAILABILITY, (req, res, ctx) => {
    const { driverId } = req.params;
    
    // Mock driver availability
    const availability = {
      driverId: driverId as string,
      status: 'AVAILABLE',
      currentLocation: {
        latitude: 30.2672,
        longitude: -97.7431
      },
      drivingMinutesRemaining: 600,
      dutyMinutesRemaining: 840,
      cycleMinutesRemaining: 3600,
      availableFrom: '2023-05-15T12:00:00Z',
      availableUntil: '2023-05-15T22:00:00Z',
      updatedAt: '2023-05-15T08:00:00Z'
    };
    
    return res(ctx.status(200), ctx.json(availability));
  }),
  
  rest.get(DRIVER_ENDPOINTS.HOS, (req, res, ctx) => {
    const { driverId } = req.params;
    
    // Mock driver HOS data
    const hosRecords = [
      {
        id: 'hos-123',
        driverId: driverId as string,
        status: 'OFF_DUTY',
        statusSince: '2023-05-15T08:00:00Z',
        drivingMinutesRemaining: 600,
        dutyMinutesRemaining: 840,
        cycleMinutesRemaining: 3600,
        location: {
          latitude: 30.2672,
          longitude: -97.7431
        },
        vehicleId: 'vehicle-123',
        eldLogId: 'eld-log-123',
        recordedAt: '2023-05-15T08:00:00Z'
      },
      {
        id: 'hos-122',
        driverId: driverId as string,
        status: 'DRIVING',
        statusSince: '2023-05-14T14:00:00Z',
        drivingMinutesRemaining: 300,
        dutyMinutesRemaining: 540,
        cycleMinutesRemaining: 3300,
        location: {
          latitude: 30.1972,
          longitude: -97.8431
        },
        vehicleId: 'vehicle-123',
        eldLogId: 'eld-log-122',
        recordedAt: '2023-05-14T18:00:00Z'
      }
    ];
    
    return res(ctx.status(200), ctx.json(hosRecords));
  }),
  
  rest.get(DRIVER_ENDPOINTS.PREFERENCES, (req, res, ctx) => {
    const { driverId } = req.params;
    
    // Mock driver preferences
    const preferences = [
      {
        id: 'pref-123',
        driverId: driverId as string,
        preferenceType: 'LOAD_TYPE',
        preferenceValue: 'DRY_VAN',
        priority: 5,
        createdAt: '2023-03-10T12:00:00Z',
        updatedAt: '2023-03-10T12:00:00Z'
      },
      {
        id: 'pref-124',
        driverId: driverId as string,
        preferenceType: 'REGION',
        preferenceValue: 'MIDWEST',
        priority: 4,
        createdAt: '2023-03-10T12:00:00Z',
        updatedAt: '2023-03-10T12:00:00Z'
      },
      {
        id: 'pref-125',
        driverId: driverId as string,
        preferenceType: 'MAX_DISTANCE',
        preferenceValue: '500',
        priority: 3,
        createdAt: '2023-03-10T12:00:00Z',
        updatedAt: '2023-03-10T12:00:00Z'
      }
    ];
    
    return res(ctx.status(200), ctx.json(preferences));
  }),
  
  // Load Handlers
  rest.get(LOAD_ENDPOINTS.GET_BY_ID, (req, res, ctx) => {
    const { loadId } = req.params;
    
    // Mock load data
    const load: Load = {
      id: loadId as string,
      shipperId: 'shipper-123',
      referenceNumber: 'REF-12345',
      description: 'Pallets of electronics',
      equipmentType: 'DRY_VAN',
      weight: 42000,
      dimensions: {
        length: 48,
        width: 8.5,
        height: 8.5
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
      updatedAt: '2023-05-15T10:00:00Z'
    };
    
    return res(ctx.status(200), ctx.json(load));
  }),
  
  rest.get(LOAD_ENDPOINTS.SEARCH, (req, res, ctx) => {
    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const equipmentType = url.searchParams.get('equipmentType');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Mock load search results
    const loads: Load[] = [
      {
        id: 'load-123',
        shipperId: 'shipper-123',
        referenceNumber: 'REF-12345',
        description: 'Pallets of electronics',
        equipmentType: 'DRY_VAN',
        weight: 42000,
        dimensions: {
          length: 48,
          width: 8.5,
          height: 8.5
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
        updatedAt: '2023-05-15T10:00:00Z'
      },
      {
        id: 'load-124',
        shipperId: 'shipper-124',
        referenceNumber: 'REF-67890',
        description: 'Refrigerated food products',
        equipmentType: 'REFRIGERATED',
        weight: 36000,
        dimensions: {
          length: 48,
          width: 8.5,
          height: 8.5
        },
        volume: 3400,
        pallets: 20,
        commodity: 'Dairy Products',
        status: 'AVAILABLE',
        pickupEarliest: '2023-05-16T14:00:00Z',
        pickupLatest: '2023-05-16T18:00:00Z',
        deliveryEarliest: '2023-05-17T14:00:00Z',
        deliveryLatest: '2023-05-17T22:00:00Z',
        offeredRate: 1050,
        specialInstructions: 'Maintain temperature between 34-38°F',
        isHazardous: false,
        temperatureRequirements: {
          min: 34,
          max: 38,
          unit: 'F'
        },
        createdAt: '2023-05-15T11:00:00Z',
        updatedAt: '2023-05-15T11:00:00Z'
      }
    ];
    
    // Filter results based on query parameters
    let filteredLoads = [...loads];
    if (status) {
      filteredLoads = filteredLoads.filter(load => load.status === status);
    }
    if (equipmentType) {
      filteredLoads = filteredLoads.filter(load => load.equipmentType === equipmentType);
    }
    
    // Pagination data
    const pagination = {
      total: filteredLoads.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLoads.length / limit)
    };
    
    return res(ctx.status(200), ctx.json({ data: filteredLoads, ...pagination }));
  }),
  
  rest.post(LOAD_ENDPOINTS.CREATE, async (req, res, ctx) => {
    // Extract request body
    const loadData = await req.json();
    
    // Mock created load with generated ID
    const createdLoad: Load = {
      id: 'load-' + Math.floor(Math.random() * 1000),
      ...loadData,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res(ctx.status(201), ctx.json(createdLoad));
  }),
  
  rest.put(LOAD_ENDPOINTS.UPDATE, async (req, res, ctx) => {
    const { loadId } = req.params;
    const updateData = await req.json();
    
    // Mock updated load
    const updatedLoad: Load = {
      id: loadId as string,
      shipperId: 'shipper-123',
      referenceNumber: updateData.referenceNumber || 'REF-12345',
      description: updateData.description || 'Pallets of electronics',
      equipmentType: updateData.equipmentType || 'DRY_VAN',
      weight: updateData.weight || 42000,
      dimensions: updateData.dimensions || {
        length: 48,
        width: 8.5,
        height: 8.5
      },
      volume: updateData.volume || 3400,
      pallets: updateData.pallets || 24,
      commodity: updateData.commodity || 'Electronics',
      status: updateData.status || 'AVAILABLE',
      pickupEarliest: updateData.pickupEarliest || '2023-05-16T08:00:00Z',
      pickupLatest: updateData.pickupLatest || '2023-05-16T12:00:00Z',
      deliveryEarliest: updateData.deliveryEarliest || '2023-05-17T08:00:00Z',
      deliveryLatest: updateData.deliveryLatest || '2023-05-17T16:00:00Z',
      offeredRate: updateData.offeredRate || 950,
      specialInstructions: updateData.specialInstructions || 'Dock high only. Appointment required.',
      isHazardous: updateData.isHazardous || false,
      temperatureRequirements: updateData.temperatureRequirements || null,
      createdAt: '2023-05-15T10:00:00Z',
      updatedAt: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json(updatedLoad));
  }),
  
  rest.put(LOAD_ENDPOINTS.STATUS, async (req, res, ctx) => {
    const { loadId } = req.params;
    const { status, statusDetails } = await req.json();
    
    // Mock load with updated status
    const updatedLoad = {
      id: loadId,
      status,
      statusDetails,
      updatedAt: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json(updatedLoad));
  }),
  
  rest.post(LOAD_ENDPOINTS.ACCEPT, async (req, res, ctx) => {
    const { loadId } = req.params;
    const { driverId, vehicleId } = await req.json();
    
    // Mock load assignment response
    const assignment = {
      id: 'assignment-' + Math.floor(Math.random() * 1000),
      loadId,
      driverId,
      vehicleId,
      assignmentType: 'DIRECT',
      status: 'ASSIGNED',
      segmentStartLocation: {
        latitude: 41.8781,
        longitude: -87.6298
      },
      segmentEndLocation: {
        latitude: 42.3314,
        longitude: -83.0458
      },
      agreedRate: 950,
      efficiencyScore: 92,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json(assignment));
  }),
  
  rest.post(LOAD_ENDPOINTS.DECLINE, async (req, res, ctx) => {
    const { loadId } = req.params;
    const { driverId, reasonCode, reasonDetails } = await req.json();
    
    // Mock decline response
    const response = {
      success: true,
      loadId,
      driverId,
      reasonCode,
      reasonDetails,
      timestamp: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json(response));
  }),
  
  // Gamification Handlers
  rest.get(GAMIFICATION_ENDPOINTS.SCORES, (req, res, ctx) => {
    // Get driver ID from query parameters
    const url = new URL(req.url);
    const driverId = url.searchParams.get('driverId') || 'driver-123';
    
    // Mock driver score
    const driverScore: DriverScore = {
      id: 'score-123',
      driverId: driverId as string,
      totalScore: 87,
      emptyMilesScore: 92, // 30% weight
      networkContributionScore: 85, // 25% weight
      onTimeScore: 90, // 20% weight
      hubUtilizationScore: 78, // 15% weight
      fuelEfficiencyScore: 88, // 10% weight
      scoreFactors: {
        'consistent_delivery': 5,
        'backhaul_utilization': 3,
        'peak_time_availability': 2
      },
      calculatedAt: '2023-05-15T10:00:00Z'
    };
    
    return res(ctx.status(200), ctx.json(driverScore));
  }),
  
  rest.get(GAMIFICATION_ENDPOINTS.ACHIEVEMENTS, (req, res, ctx) => {
    // Get driver ID from query parameters
    const url = new URL(req.url);
    const driverId = url.searchParams.get('driverId') || 'driver-123';
    
    // Mock achievements
    const achievements = [
      {
        id: 'achievement-123',
        driverId,
        achievementId: 'efficiency-master-1',
        achievement: {
          id: 'efficiency-master-1',
          name: 'Efficiency Master',
          description: 'Maintain an efficiency score above 85 for 30 days',
          category: 'EFFICIENCY',
          level: 'SILVER',
          points: 500,
          badgeImageUrl: 'https://assets.example.com/badges/efficiency-master-silver.png',
          isActive: true
        },
        earnedAt: '2023-04-15T14:30:00Z'
      },
      {
        id: 'achievement-124',
        driverId,
        achievementId: 'zero-deadhead-1',
        achievement: {
          id: 'zero-deadhead-1',
          name: 'Zero Deadhead Hero',
          description: 'Complete 10 consecutive loads with less than 5% empty miles',
          category: 'NETWORK_CONTRIBUTION',
          level: 'BRONZE',
          points: 300,
          badgeImageUrl: 'https://assets.example.com/badges/zero-deadhead-bronze.png',
          isActive: true
        },
        earnedAt: '2023-03-22T09:15:00Z'
      },
      {
        id: 'achievement-125',
        driverId,
        achievementId: 'hub-connector-1',
        achievement: {
          id: 'hub-connector-1',
          name: 'Hub Connector',
          description: 'Participate in 5 Smart Hub exchanges',
          category: 'SMART_HUB_UTILIZATION',
          level: 'BRONZE',
          points: 250,
          badgeImageUrl: 'https://assets.example.com/badges/hub-connector-bronze.png',
          isActive: true
        },
        earnedAt: '2023-05-01T16:45:00Z'
      }
    ];
    
    return res(ctx.status(200), ctx.json(achievements));
  }),
  
  rest.get(GAMIFICATION_ENDPOINTS.LEADERBOARDS, (req, res, ctx) => {
    // Get query parameters
    const url = new URL(req.url);
    const leaderboardType = url.searchParams.get('type') || 'EFFICIENCY';
    const timeframe = url.searchParams.get('timeframe') || 'WEEKLY';
    const region = url.searchParams.get('region') || 'MIDWEST';
    
    // Mock leaderboard data
    const leaderboard: Leaderboard = {
      id: `leaderboard-${leaderboardType}-${timeframe}-${region}`,
      name: `${region} ${timeframe} ${leaderboardType} Leaderboard`,
      leaderboardType: leaderboardType as any,
      timeframe: timeframe as any,
      region,
      startPeriod: '2023-05-08T00:00:00Z',
      endPeriod: '2023-05-14T23:59:59Z',
      isActive: true,
      lastUpdated: '2023-05-15T01:00:00Z',
      bonusStructure: {
        1: 450,
        2: 400,
        3: 350,
        4: 300,
        5: 250
      }
    };
    
    // Mock leaderboard entries
    const entries: LeaderboardEntry[] = [
      {
        id: 'entry-123',
        leaderboardId: leaderboard.id,
        driverId: 'driver-456',
        driverName: 'Thomas K.',
        rank: 1,
        previousRank: 3,
        score: 96,
        bonusAmount: 450,
        isCurrentDriver: false
      },
      {
        id: 'entry-124',
        leaderboardId: leaderboard.id,
        driverId: 'driver-789',
        driverName: 'Sarah M.',
        rank: 2,
        previousRank: 1,
        score: 94,
        bonusAmount: 400,
        isCurrentDriver: false
      },
      {
        id: 'entry-125',
        leaderboardId: leaderboard.id,
        driverId: 'driver-234',
        driverName: 'Robert J.',
        rank: 3,
        previousRank: 2,
        score: 91,
        bonusAmount: 350,
        isCurrentDriver: false
      },
      {
        id: 'entry-126',
        leaderboardId: leaderboard.id,
        driverId: 'driver-123',
        driverName: 'John D.',
        rank: 7,
        previousRank: 9,
        score: 87,
        bonusAmount: 200,
        isCurrentDriver: true
      }
    ];
    
    return res(ctx.status(200), ctx.json({ leaderboard, entries }));
  }),
  
  rest.get(GAMIFICATION_ENDPOINTS.BONUS_ZONES, (req, res, ctx) => {
    // Get query parameters
    const url = new URL(req.url);
    const latitude = parseFloat(url.searchParams.get('latitude') || '40.7128');
    const longitude = parseFloat(url.searchParams.get('longitude') || '-74.0060');
    const radius = parseInt(url.searchParams.get('radius') || '50');
    
    // Mock bonus zones
    const bonusZones: BonusZone[] = [
      {
        id: 'zone-123',
        name: 'Chicago-Detroit Corridor',
        boundary: [
          { latitude: 41.8781, longitude: -87.6298 }, // Chicago
          { latitude: 41.7, longitude: -87.2 },
          { latitude: 41.9, longitude: -85.5 },
          { latitude: 42.3314, longitude: -83.0458 }, // Detroit
          { latitude: 42.5, longitude: -83.5 },
          { latitude: 42.0, longitude: -86.0 },
          { latitude: 41.8781, longitude: -87.6298 } // Close the polygon
        ],
        multiplier: 1.2,
        reason: 'High demand for eastbound loads',
        startTime: '2023-05-15T00:00:00Z',
        endTime: '2023-05-17T23:59:59Z',
        isActive: true
      },
      {
        id: 'zone-124',
        name: 'Cleveland Zone',
        boundary: [
          { latitude: 41.4993, longitude: -81.6944 }, // Cleveland
          { latitude: 41.6, longitude: -81.4 },
          { latitude: 41.7, longitude: -81.5 },
          { latitude: 41.6, longitude: -82.0 },
          { latitude: 41.4, longitude: -81.9 },
          { latitude: 41.4993, longitude: -81.6944 } // Close the polygon
        ],
        multiplier: 1.15,
        reason: 'Driver shortage in the area',
        startTime: '2023-05-16T00:00:00Z',
        endTime: '2023-05-18T23:59:59Z',
        isActive: true
      }
    ];
    
    return res(ctx.status(200), ctx.json(bonusZones));
  }),
  
  // Tracking Handlers
  rest.get(TRACKING_ENDPOINTS.POSITIONS, (req, res, ctx) => {
    // Get entity ID from query parameters
    const url = new URL(req.url);
    const entityId = url.searchParams.get('entityId') || 'driver-123';
    const entityType = url.searchParams.get('entityType') || 'driver';
    
    // Mock current position data
    const position = {
      entityId,
      entityType,
      latitude: 40.7128,
      longitude: -74.0060,
      heading: 90, // degrees (east)
      speed: 65, // mph
      accuracy: 5, // meters
      timestamp: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json(position));
  }),
  
  rest.get(TRACKING_ENDPOINTS.HISTORY, (req, res, ctx) => {
    // Get entity ID and time range from query parameters
    const url = new URL(req.url);
    const entityId = url.searchParams.get('entityId') || 'driver-123';
    const startTime = url.searchParams.get('startTime') || '2023-05-14T00:00:00Z';
    const endTime = url.searchParams.get('endTime') || '2023-05-15T23:59:59Z';
    
    // Mock position history data
    const positions = [
      {
        id: 'pos-123',
        entityId,
        latitude: 40.7128,
        longitude: -74.0060,
        heading: 90,
        speed: 65,
        accuracy: 4,
        timestamp: '2023-05-15T10:00:00Z'
      },
      {
        id: 'pos-124',
        entityId,
        latitude: 40.7150,
        longitude: -73.9950,
        heading: 90,
        speed: 60,
        accuracy: 5,
        timestamp: '2023-05-15T10:15:00Z'
      },
      {
        id: 'pos-125',
        entityId,
        latitude: 40.7170,
        longitude: -73.9850,
        heading: 85,
        speed: 62,
        accuracy: 4,
        timestamp: '2023-05-15T10:30:00Z'
      }
    ];
    
    return res(ctx.status(200), ctx.json(positions));
  }),
  
  rest.get(TRACKING_ENDPOINTS.ETA, (req, res, ctx) => {
    // Get entity ID and destination from query parameters
    const url = new URL(req.url);
    const entityId = url.searchParams.get('entityId') || 'driver-123';
    const destinationId = url.searchParams.get('destinationId') || 'location-456';
    
    // Mock ETA prediction
    const eta = {
      entityId,
      destinationId,
      estimatedArrival: '2023-05-15T14:30:00Z',
      confidenceLevel: 'HIGH',
      distanceRemaining: 120, // miles
      timeRemaining: 7200, // seconds
      trafficConditions: 'MODERATE',
      updatedAt: new Date().toISOString()
    };
    
    return res(ctx.status(200), ctx.json(eta));
  }),
  
  // Market Intelligence Handlers
  rest.get(MARKET_ENDPOINTS.RATES, (req, res, ctx) => {
    // Get route parameters from query
    const url = new URL(req.url);
    const origin = url.searchParams.get('origin') || 'Chicago, IL';
    const destination = url.searchParams.get('destination') || 'Detroit, MI';
    const equipmentType = url.searchParams.get('equipmentType') || 'DRY_VAN';
    
    // Mock rate data
    const rateData = {
      origin,
      destination,
      equipmentType,
      distance: 280, // miles
      averageRate: 950,
      minRate: 850,
      maxRate: 1050,
      ratePerMile: 3.39,
      confidence: 'HIGH',
      lastUpdated: '2023-05-15T06:00:00Z',
      forecast: {
        trend: 'STABLE',
        nextWeekPrediction: 'SLIGHT_INCREASE'
      }
    };
    
    return res(ctx.status(200), ctx.json(rateData));
  }),
];

export default handlers;