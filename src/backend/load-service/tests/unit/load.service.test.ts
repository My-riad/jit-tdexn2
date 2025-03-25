import { LoadService } from '../../src/services/load.service';
import { LoadModel } from '../../src/models/load.model';
import { LoadLocationModel } from '../../src/models/load-location.model';
import { LoadStatusModel } from '../../src/models/load-status.model';
import { LoadDocumentModel } from '../../src/models/load-document.model';
import LoadEventsProducer from '../../src/producers/load-events.producer';
import {
  Load,
  LoadStatus,
  EquipmentType,
  LoadCreationParams,
  LoadUpdateParams,
  LoadStatusUpdateParams,
  LoadSearchParams,
} from '../../../common/interfaces/load.interface';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { createLoadSchema, updateLoadSchema, updateLoadStatusSchema, loadSearchSchema } from '../../src/validators/load.validator';
import Joi from 'joi'; // joi@^17.0.0

// Mock the LoadEventsProducer class
jest.mock('../../src/producers/load-events.producer');

// Helper function to create a mock load object for testing
const createMockLoad = (overrides: Partial<Load> = {}): Load => {
  const defaultLoad: Load = {
    load_id: 'load-123',
    shipper_id: 'shipper-456',
    reference_number: 'REF-789',
    description: 'Test Load',
    equipment_type: EquipmentType.DRY_VAN,
    weight: 40000,
    dimensions: { length: 40, width: 8, height: 8 },
    volume: 2000,
    pallets: 20,
    commodity: 'Test Commodity',
    status: LoadStatus.CREATED,
    pickup_earliest: new Date(),
    pickup_latest: new Date(),
    delivery_earliest: new Date(),
    delivery_latest: new Date(),
    offered_rate: 1000,
    special_instructions: 'Handle with care',
    is_hazardous: false,
    temperature_requirements: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return { ...defaultLoad, ...overrides };
};

// Helper function to create mock load creation parameters for testing
const createMockLoadCreationParams = (overrides: Partial<LoadCreationParams> = {}): LoadCreationParams => {
  const defaultParams: LoadCreationParams = {
    shipper_id: 'shipper-456',
    reference_number: 'REF-789',
    description: 'Test Load',
    equipment_type: EquipmentType.DRY_VAN,
    weight: 40000,
    dimensions: { length: 40, width: 8, height: 8 },
    volume: 2000,
    pallets: 20,
    commodity: 'Test Commodity',
    pickup_earliest: new Date(),
    pickup_latest: new Date(),
    delivery_earliest: new Date(),
    delivery_latest: new Date(),
    offered_rate: 1000,
    special_instructions: 'Handle with care',
    is_hazardous: false,
    temperature_requirements: null,
    locations: []
  };

  return { ...defaultParams, ...overrides };
};

describe('LoadService', () => {
  let loadService: LoadService;
  let eventsProducer: LoadEventsProducer;

  beforeEach(() => {
    jest.clearAllMocks();
    eventsProducer = new LoadEventsProducer({} as any); // Provide a mock KafkaService if needed
    loadService = new LoadService(eventsProducer);
  });

  it('should be defined', () => {
    expect(loadService).toBeDefined();
  });

  it('getLoadById should return a load when found', async () => {
    const mockLoad = createMockLoad();
    (LoadModel.get as jest.Mock).mockResolvedValue(mockLoad);

    const load = await loadService.getLoadById('load-123');

    expect(load).toEqual(mockLoad);
    expect(LoadModel.get).toHaveBeenCalledWith('load-123');
  });

  it('getLoadById should return null when load not found', async () => {
    (LoadModel.get as jest.Mock).mockResolvedValue(undefined);

    const load = await loadService.getLoadById('load-123');

    expect(load).toBeNull();
    expect(LoadModel.get).toHaveBeenCalledWith('load-123');
  });

  it('getLoadById should handle errors properly', async () => {
    (LoadModel.get as jest.Mock).mockRejectedValue(new Error('Test error'));

    await expect(loadService.getLoadById('load-123')).rejects.toThrow(AppError);
    expect(LoadModel.get).toHaveBeenCalledWith('load-123');
  });

  it('getLoadWithDetails should return a load with details when found', async () => {
    const mockLoadWithDetails = {
      ...createMockLoad(),
      locations: [],
      status_history: [],
      documents: [],
      assignments: [],
      shipper: { shipper_id: 'shipper-456' },
    };
    (LoadModel.getWithDetails as jest.Mock).mockResolvedValue(mockLoadWithDetails);

    const loadWithDetails = await loadService.getLoadWithDetails('load-123');

    expect(loadWithDetails).toEqual(mockLoadWithDetails);
    expect(LoadModel.getWithDetails).toHaveBeenCalledWith('load-123');
  });

  it('getLoadsByShipperId should return loads for a shipper', async () => {
    const mockLoads = [createMockLoad(), createMockLoad()];
    const mockTotal = 2;
    (LoadModel.getByShipperId as jest.Mock).mockResolvedValue({ loads: mockLoads, total: mockTotal });

    const { loads, total } = await loadService.getLoadsByShipperId('shipper-456');

    expect(loads).toEqual(mockLoads);
    expect(total).toEqual(mockTotal);
    expect(LoadModel.getByShipperId).toHaveBeenCalledWith('shipper-456', {});
  });

  it('searchLoads should return loads matching search criteria', async () => {
    const mockLoads = [createMockLoad(), createMockLoad()];
    const mockTotal = 2;
    (loadSearchSchema.validate as jest.Mock).mockReturnValue({ value: {} });
    (LoadModel.search as jest.Mock).mockResolvedValue({ loads: mockLoads, total: mockTotal });

    const { loads, total } = await loadService.searchLoads({});

    expect(loads).toEqual(mockLoads);
    expect(total).toEqual(mockTotal);
    expect(LoadModel.search).toHaveBeenCalledWith({});
  });

  it('searchLoads should throw validation error for invalid search params', async () => {
    const validationError = new Error('Validation failed');
    (loadSearchSchema.validate as jest.Mock).mockReturnValue({ error: validationError });

    await expect(loadService.searchLoads({})).rejects.toThrow(validationError);
    expect(LoadModel.search).not.toHaveBeenCalled();
  });

  it('createLoad should create a new load', async () => {
    const mockLoad = createMockLoad();
    (createLoadSchema.validate as jest.Mock).mockReturnValue({ value: {} });
    (LoadModel.create as jest.Mock).mockResolvedValue(mockLoad);
    (eventsProducer.createLoadCreatedEvent as jest.Mock).mockResolvedValue(undefined);

    const load = await loadService.createLoad(createMockLoadCreationParams());

    expect(load).toEqual(mockLoad);
    expect(LoadModel.create).toHaveBeenCalled();
    expect(eventsProducer.createLoadCreatedEvent).toHaveBeenCalledWith(mockLoad);
  });

  it('createLoad should throw validation error for invalid load data', async () => {
    const validationError = new Error('Validation failed');
    (createLoadSchema.validate as jest.Mock).mockReturnValue({ error: validationError });

    await expect(loadService.createLoad(createMockLoadCreationParams())).rejects.toThrow(validationError);
    expect(LoadModel.create).not.toHaveBeenCalled();
    expect(eventsProducer.createLoadCreatedEvent).not.toHaveBeenCalled();
  });

  it('updateLoad should update an existing load', async () => {
    const mockLoad = createMockLoad();
    (updateLoadSchema.validate as jest.Mock).mockReturnValue({ value: {} });
    (LoadModel.update as jest.Mock).mockResolvedValue(mockLoad);
    (eventsProducer.createLoadUpdatedEvent as jest.Mock).mockResolvedValue(undefined);

    const load = await loadService.updateLoad('load-123', {});

    expect(load).toEqual(mockLoad);
    expect(LoadModel.update).toHaveBeenCalledWith('load-123', {});
    expect(eventsProducer.createLoadUpdatedEvent).toHaveBeenCalledWith(mockLoad);
  });

  it('updateLoad should return null when load not found', async () => {
    (updateLoadSchema.validate as jest.Mock).mockReturnValue({ value: {} });
    (LoadModel.update as jest.Mock).mockResolvedValue(undefined);

    const load = await loadService.updateLoad('load-123', {});

    expect(load).toBeNull();
    expect(LoadModel.update).toHaveBeenCalledWith('load-123', {});
    expect(eventsProducer.createLoadUpdatedEvent).not.toHaveBeenCalled();
  });

  it("updateLoadStatus should update a load's status", async () => {
    const mockLoad = createMockLoad({ status: LoadStatus.CREATED });
    const mockUpdatedLoad = createMockLoad({ status: LoadStatus.ASSIGNED });
    (updateLoadStatusSchema.validate as jest.Mock).mockReturnValue({ value: {} });
    (LoadModel.get as jest.Mock).mockResolvedValue(mockLoad);
    (LoadModel.isValidStatusTransition as jest.Mock).mockReturnValue(true);
    (LoadModel.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedLoad);
    (eventsProducer.createLoadStatusChangedEvent as jest.Mock).mockResolvedValue(undefined);

    const statusUpdateParams: LoadStatusUpdateParams = {
      status: LoadStatus.ASSIGNED,
      updated_by: 'test',
    };
    const load = await loadService.updateLoadStatus('load-123', statusUpdateParams);

    expect(load).toEqual(mockUpdatedLoad);
    expect(LoadModel.updateStatus).toHaveBeenCalledWith('load-123', statusUpdateParams);
    expect(eventsProducer.createLoadStatusChangedEvent).toHaveBeenCalledWith(
      mockUpdatedLoad,
      LoadStatus.CREATED,
      {}
    );
  });

  it('updateLoadStatus should throw error for invalid status transition', async () => {
    const mockLoad = createMockLoad({ status: LoadStatus.CREATED });
    (updateLoadStatusSchema.validate as jest.Mock).mockReturnValue({ value: {} });
    (LoadModel.get as jest.Mock).mockResolvedValue(mockLoad);
    (LoadModel.isValidStatusTransition as jest.Mock).mockReturnValue(false);

    const statusUpdateParams: LoadStatusUpdateParams = {
      status: LoadStatus.ASSIGNED,
      updated_by: 'test',
    };
    await expect(loadService.updateLoadStatus('load-123', statusUpdateParams)).rejects.toThrow(AppError);
    expect(LoadModel.updateStatus).not.toHaveBeenCalled();
    expect(eventsProducer.createLoadStatusChangedEvent).not.toHaveBeenCalled();
  });

  it('deleteLoad should delete an existing load', async () => {
    (LoadModel.delete as jest.Mock).mockResolvedValue(true);
    (eventsProducer.createLoadDeletedEvent as jest.Mock).mockResolvedValue(undefined);

    const result = await loadService.deleteLoad('load-123');

    expect(result).toBe(true);
    expect(LoadModel.delete).toHaveBeenCalledWith('load-123');
    expect(eventsProducer.createLoadDeletedEvent).toHaveBeenCalledWith('load-123');
  });

  it('deleteLoad should return false when load not found', async () => {
    (LoadModel.delete as jest.Mock).mockResolvedValue(false);

    const result = await loadService.deleteLoad('load-123');

    expect(result).toBe(false);
    expect(LoadModel.delete).toHaveBeenCalledWith('load-123');
    expect(eventsProducer.createLoadDeletedEvent).not.toHaveBeenCalled();
  });

  it('getLoadStatusCounts should return status counts', async () => {
    const mockStatusCounts = {
      [LoadStatus.CREATED]: 1,
      [LoadStatus.ASSIGNED]: 2,
    };
    (LoadModel.getStatusCounts as jest.Mock).mockResolvedValue(mockStatusCounts);

    const statusCounts = await loadService.getLoadStatusCounts();

    expect(statusCounts).toEqual(mockStatusCounts);
    expect(LoadModel.getStatusCounts).toHaveBeenCalled();
  });

  it('getLoadStatusHistory should return status history', async () => {
    const mockStatusHistory = [{ status: LoadStatus.CREATED }, { status: LoadStatus.ASSIGNED }];
    (LoadStatusModel.getStatusTimeline as jest.Mock).mockResolvedValue(mockStatusHistory);

    const statusHistory = await loadService.getLoadStatusHistory('load-123');

    expect(statusHistory).toEqual(mockStatusHistory);
    expect(LoadStatusModel.getStatusTimeline).toHaveBeenCalledWith('load-123');
  });

  it('getLoadLocations should return load locations', async () => {
    const mockLocations = [{ location_id: 'loc-1' }, { location_id: 'loc-2' }];
    (LoadLocationModel.getByLoadId as jest.Mock).mockResolvedValue(mockLocations);

    const locations = await loadService.getLoadLocations('load-123');

    expect(locations).toEqual(mockLocations);
    expect(LoadLocationModel.getByLoadId).toHaveBeenCalledWith('load-123');
  });

  it('updateLoadLocation should update a location', async () => {
    const mockUpdatedLocation = { location_id: 'loc-1', address: 'New Address' };
    (LoadLocationModel.update as jest.Mock).mockResolvedValue(mockUpdatedLocation);

    const updatedLocation = await loadService.updateLoadLocation('loc-1', { address: 'New Address' });

    expect(updatedLocation).toEqual(mockUpdatedLocation);
    expect(LoadLocationModel.update).toHaveBeenCalledWith('loc-1', { address: 'New Address' });
  });

  it('getLoadDocuments should return load documents', async () => {
    const mockDocuments = [{ document_id: 'doc-1' }, { document_id: 'doc-2' }];
    (LoadDocumentModel.getByLoadId as jest.Mock).mockResolvedValue(mockDocuments);

    const documents = await loadService.getLoadDocuments('load-123');

    expect(documents).toEqual(mockDocuments);
    expect(LoadDocumentModel.getByLoadId).toHaveBeenCalledWith('load-123');
  });

  it('addLoadDocument should add a document to a load', async () => {
    const mockDocument = { document_id: 'doc-1' };
    (LoadDocumentModel.create as jest.Mock).mockResolvedValue(mockDocument);
    (eventsProducer.createLoadDocumentAddedEvent as jest.Mock).mockResolvedValue(undefined);

    const document = await loadService.addLoadDocument('load-123', { filename: 'test.pdf' });

    expect(document).toEqual(mockDocument);
    expect(LoadDocumentModel.create).toHaveBeenCalled();
    expect(eventsProducer.createLoadDocumentAddedEvent).toHaveBeenCalledWith('load-123', mockDocument);
  });

  it('updateLoadDocument should update a document', async () => {
    const mockUpdatedDocument = { document_id: 'doc-1', filename: 'new_test.pdf' };
    (LoadDocumentModel.update as jest.Mock).mockResolvedValue(mockUpdatedDocument);

    const updatedDocument = await loadService.updateLoadDocument('doc-1', { filename: 'new_test.pdf' });

    expect(updatedDocument).toEqual(mockUpdatedDocument);
    expect(LoadDocumentModel.update).toHaveBeenCalledWith('doc-1', { filename: 'new_test.pdf' });
  });

  it('deleteLoadDocument should delete a document', async () => {
    (LoadDocumentModel.delete as jest.Mock).mockResolvedValue(true);

    const result = await loadService.deleteLoadDocument('doc-1');

    expect(result).toBe(true);
    expect(LoadDocumentModel.delete).toHaveBeenCalledWith('doc-1');
  });

  it('validateLoadData should validate data against schema', async () => {
    const testSchema = Joi.object({ value: Joi.string().required() });
    const testData = { value: 'test' };
    const validatedData = { value: 'test' };
    (testSchema.validate as jest.Mock).mockReturnValue({ value: validatedData });

    const result = (loadService as any).validateLoadData(testData, testSchema);

    expect(result).toEqual(validatedData);
    expect(testSchema.validate).toHaveBeenCalledWith(testData);
  });

  it('validateLoadData should throw validation error for invalid data', async () => {
    const testSchema = Joi.object({ value: Joi.string().required() });
    const testData = { value: 123 };
    const validationError = new Error('Validation failed');
    (testSchema.validate as jest.Mock).mockReturnValue({ error: validationError });

    expect(() => (loadService as any).validateLoadData(testData, testSchema)).toThrow(AppError);
    expect(testSchema.validate).toHaveBeenCalledWith(testData);
  });
});