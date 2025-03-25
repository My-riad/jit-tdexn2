import supertest from 'supertest'; // version: ^6.3.3
import { Express } from 'express';
import { initializeApp } from '../../src/app';
import { LoadModel } from '../../src/models/load.model';
import { LoadStatusModel } from '../../src/models/load-status.model';
import { LoadDocumentModel } from '../../src/models/load-document.model';
import { LoadStatus, EquipmentType } from '../../../common/interfaces/load.interface';
import { StatusCodes } from '../../../common/constants/status-codes';
import path from 'path'; // built-in
import fs from 'fs-extra'; // version: ^11.1.1
import { generateAuthToken } from 'auth-utils-testing'; // version: ^1.0.0

// Jest version
import jest from 'jest';

// Define global variables for the Express app and authentication token
let app: Express;
let authToken: string;

// Define global variables for test load and shipper IDs
let testLoadId: string;
let testShipperId: string;

/**
 * Helper function to create a test load in the database
 * @param loadData - The load data to use for creation
 * @returns Promise<any>: The created load object
 */
const createTestLoad = async (loadData: any = {}): Promise<any> => {
  // LD1: Create a default load object with required properties
  const defaultLoad = {
    shipper_id: testShipperId,
    reference_number: 'TEST-REF-123',
    equipment_type: EquipmentType.DRY_VAN,
    weight: 40000,
    dimensions: { length: 40, width: 8, height: 8 },
    commodity: 'Test Commodity',
    pickup_earliest: new Date(),
    pickup_latest: new Date(),
    delivery_earliest: new Date(),
    delivery_latest: new Date(),
    offered_rate: 1000,
    is_hazardous: false,
    locations: [
      {
        location_type: 'PICKUP',
        facility_name: 'Test Pickup Facility',
        address: '123 Test St',
        city: 'Test City',
        state: 'IL',
        zip: '60601',
        latitude: 41.8781,
        longitude: -87.6298,
        earliest_time: new Date(),
        latest_time: new Date(),
        contact_name: 'John Doe',
        contact_phone: '(123) 456-7890',
        special_instructions: 'Test pickup instructions'
      },
      {
        location_type: 'DELIVERY',
        facility_name: 'Test Delivery Facility',
        address: '456 Test Ave',
        city: 'Test City',
        state: 'MI',
        zip: '48202',
        latitude: 42.3314,
        longitude: -83.0458,
        earliest_time: new Date(),
        latest_time: new Date(),
        contact_name: 'Jane Smith',
        contact_phone: '(313) 555-1212',
        special_instructions: 'Test delivery instructions'
      }
    ]
  };

  // LD1: Apply any overrides from the loadData parameter
  const load = { ...defaultLoad, ...loadData };

  // LD1: Call LoadModel.create with the prepared load data
  const createdLoad = await LoadModel.create(load);

  // LD1: Create an initial status record using LoadStatusModel.create
  await LoadStatusModel.create({
    load_id: createdLoad.load_id,
    status: LoadStatus.CREATED,
    status_details: { message: 'Load created for testing' },
    updated_by: 'test'
  });

  // LD1: Return the created load object
  return createdLoad;
};

/**
 * Helper function to clean up a test load from the database
 * @param loadId - The ID of the load to delete
 * @returns Promise<void>: No return value
 */
const cleanupTestLoad = async (loadId: string): Promise<void> => {
  try {
    // LD1: Delete any documents associated with the load using LoadDocumentModel
    await LoadDocumentModel.deleteByLoadId(loadId);

    // LD1: Delete the load using LoadModel.delete
    await LoadModel.delete(loadId);
  } catch (error: any) {
    // LD1: Handle any errors that occur during cleanup
    console.error('Error cleaning up test load', error);
  }
};

/**
 * Helper function to create a test document for a load
 * @param loadId - The ID of the load to associate the document with
 * @param documentData - The document data to use for creation
 * @returns Promise<any>: The created document object
 */
const createTestDocument = async (loadId: string, documentData: any = {}): Promise<any> => {
  // LD1: Create a default document object with required properties
  const defaultDocument = {
    load_id: loadId,
    document_type: 'BILL_OF_LADING',
    filename: 'test.pdf',
    content_type: 'application/pdf',
    storage_url: 's3://test-bucket/test.pdf',
    uploaded_by: 'test'
  };

  // LD1: Apply any overrides from the documentData parameter
  const document = { ...defaultDocument, ...documentData };

  // LD1: Call LoadDocumentModel.create with the prepared document data
  const createdDocument = await LoadDocumentModel.create(document);

  // LD1: Return the created document object
  return createdDocument;
};

// Integration test suite for Load API endpoints
describe('Load API Integration Tests', () => {
  // BeforeAll hook to initialize the Express application and authentication token
  beforeAll(async () => {
    // LD1: Initialize the Express application using initializeApp
    app = await initializeApp();

    // LD1: Generate an authentication token for API requests
    authToken = generateAuthToken({
      userId: 'test-user',
      email: 'test@example.com',
      roles: ['shipper']
    });

    // Set a test shipper ID
    testShipperId = 'test-shipper-id';
  });

  // BeforeEach hook to create a test load in the database
  beforeEach(async () => {
    // LD1: Create a test load in the database for use in tests
    const load = await createTestLoad();
    testLoadId = load.load_id;
  });

  // AfterEach hook to clean up test data from the database
  afterEach(async () => {
    // LD1: Clean up test data from the database
    await cleanupTestLoad(testLoadId);
  });

  // AfterAll hook to close database connections
  afterAll(async () => {
    // LD1: Close database connections
    // await db.closeKnexConnection();
  });

  // Test case: GET /loads/:loadId should return a load when it exists
  it('GET /loads/:loadId should return a load when it exists', async () => {
    // LD1: Send a GET request to /api/loads/{testLoadId} with authentication
    const response = await supertest(app)
      .get(`/api/v1/loads/${testLoadId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the expected load data
    expect(response.body.load_id).toBe(testLoadId);
  });

  // Test case: GET /loads/:loadId should return 404 when load doesn't exist
  it("GET /loads/:loadId should return 404 when load doesn't exist", async () => {
    // LD1: Send a GET request to /api/loads/nonexistent-id with authentication
    const response = await supertest(app)
      .get('/api/v1/loads/nonexistent-id')
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 404 Not Found response
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  // Test case: GET /loads/:loadId/details should return load with details
  it('GET /loads/:loadId/details should return load with details', async () => {
    // LD1: Send a GET request to /api/loads/{testLoadId}/details with authentication
    const response = await supertest(app)
      .get(`/api/v1/loads/${testLoadId}/details`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the load with locations, status history, and documents
    expect(response.body.load_id).toBe(testLoadId);
    expect(response.body.locations).toBeDefined();
    expect(response.body.status_history).toBeDefined();
    expect(response.body.documents).toBeDefined();
  });

  // Test case: GET /loads/shipper/:shipperId should return loads for a shipper
  it('GET /loads/shipper/:shipperId should return loads for a shipper', async () => {
    // LD1: Send a GET request to /api/loads/shipper/{testShipperId} with authentication
    const response = await supertest(app)
      .get(`/api/v1/loads/shipper/${testShipperId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains an array of loads and total count
    expect(response.body.loads).toBeInstanceOf(Array);
    expect(response.body.total).toBeDefined();
  });

  // Test case: GET /loads should return loads matching search criteria
  it('GET /loads should return loads matching search criteria', async () => {
    // LD1: Send a GET request to /api/loads with search query parameters and authentication
    const response = await supertest(app)
      .get('/api/v1/loads?equipment_type=DRY_VAN')
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains matching loads and total count
    expect(response.body.loads).toBeInstanceOf(Array);
    expect(response.body.total).toBeDefined();
  });

  // Test case: POST /loads should create a new load
  it('POST /loads should create a new load', async () => {
    // LD1: Send a POST request to /api/loads with valid load data and authentication
    const newLoadData = {
      shipper_id: testShipperId,
      reference_number: 'NEW-LOAD-REF',
      equipment_type: EquipmentType.REEFER,
      weight: 35000,
      dimensions: { length: 35, width: 8, height: 8 },
      commodity: 'Refrigerated Goods',
      pickup_earliest: new Date(),
      pickup_latest: new Date(),
      delivery_earliest: new Date(),
      delivery_latest: new Date(),
      offered_rate: 1200,
      is_hazardous: false,
      locations: [
        {
          location_type: 'PICKUP',
          facility_name: 'New Pickup Facility',
          address: '789 New St',
          city: 'New City',
          state: 'GA',
          zip: '30303',
          latitude: 33.7490,
          longitude: -84.3880,
          earliest_time: new Date(),
          latest_time: new Date(),
          contact_name: 'Bob Brown',
          contact_phone: '(404) 555-4444',
          special_instructions: 'New pickup instructions'
        },
        {
          location_type: 'DELIVERY',
          facility_name: 'New Delivery Facility',
          address: '101 New Ave',
          city: 'New City',
          state: 'FL',
          zip: '32801',
          latitude: 28.5383,
          longitude: -81.3792,
          earliest_time: new Date(),
          latest_time: new Date(),
          contact_name: 'Alice Green',
          contact_phone: '(407) 555-3333',
          special_instructions: 'New delivery instructions'
        }
      ]
    };
    const response = await supertest(app)
      .post('/api/v1/loads')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newLoadData);

    // LD1: Expect a 201 Created response
    expect(response.status).toBe(StatusCodes.CREATED);

    // LD1: Verify that the response body contains the created load
    expect(response.body.load_id).toBeDefined();

    // LD1: Verify that the load was actually created in the database
    const createdLoad = await LoadModel.get(response.body.load_id);
    expect(createdLoad).toBeDefined();

    // Clean up the newly created load
    await cleanupTestLoad(response.body.load_id);
  });

  // Test case: POST /loads should return 400 for invalid load data
  it('POST /loads should return 400 for invalid load data', async () => {
    // LD1: Send a POST request to /api/loads with invalid load data and authentication
    const invalidLoadData = {
      shipper_id: 'invalid-shipper-id', // Invalid UUID
      reference_number: '', // Empty string
      equipment_type: 'INVALID_EQUIPMENT', // Invalid enum value
      weight: -100, // Negative weight
      dimensions: { length: -10, width: -5, height: -2 }, // Invalid dimensions
      commodity: '', // Empty string
      pickup_earliest: 'invalid-date', // Invalid date
      pickup_latest: 'invalid-date', // Invalid date
      delivery_earliest: 'invalid-date', // Invalid date
      delivery_latest: 'invalid-date', // Invalid date
      offered_rate: -50, // Negative rate
      is_hazardous: 'not-a-boolean', // Invalid boolean
      locations: [] // Empty locations array
    };
    const response = await supertest(app)
      .post('/api/v1/loads')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidLoadData);

    // LD1: Expect a 400 Bad Request response
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);

    // LD1: Verify that the response body contains validation error details
    expect(response.body.details).toBeDefined();
  });

  // Test case: PUT /loads/:loadId should update an existing load
  it('PUT /loads/:loadId should update an existing load', async () => {
    // LD1: Send a PUT request to /api/loads/{testLoadId} with valid update data and authentication
    const updateData = {
      description: 'Updated test load description',
      offered_rate: 1100
    };
    const response = await supertest(app)
      .put(`/api/v1/loads/${testLoadId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the updated load
    expect(response.body.load_id).toBe(testLoadId);
    expect(response.body.description).toBe(updateData.description);
    expect(response.body.offered_rate).toBe(updateData.offered_rate);

    // LD1: Verify that the load was actually updated in the database
    const updatedLoad = await LoadModel.get(testLoadId);
    expect(updatedLoad?.description).toBe(updateData.description);
    expect(updatedLoad?.offered_rate).toBe(updateData.offered_rate);
  });

  // Test case: PUT /loads/:loadId should return 404 when load doesn't exist
  it("PUT /loads/:loadId should return 404 when load doesn't exist", async () => {
    // LD1: Send a PUT request to /api/loads/nonexistent-id with valid update data and authentication
    const updateData = {
      description: 'Updated test load description',
      offered_rate: 1100
    };
    const response = await supertest(app)
      .put('/api/v1/loads/nonexistent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // LD1: Expect a 404 Not Found response
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  // Test case: DELETE /loads/:loadId should delete an existing load
  it('DELETE /loads/:loadId should delete an existing load', async () => {
    // LD1: Create a temporary test load for deletion
    const tempLoad = await createTestLoad();
    const tempLoadId = tempLoad.load_id;

    // LD1: Send a DELETE request to /api/loads/{tempLoadId} with authentication
    const response = await supertest(app)
      .delete(`/api/v1/loads/${tempLoadId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the load was actually deleted from the database
    const deletedLoad = await LoadModel.get(tempLoadId);
    expect(deletedLoad).toBeUndefined();
  });

  // Test case: DELETE /loads/:loadId should return 404 when load doesn't exist
  it("DELETE /loads/:loadId should return 404 when load doesn't exist", async () => {
    // LD1: Send a DELETE request to /api/loads/nonexistent-id with authentication
    const response = await supertest(app)
      .delete('/api/v1/loads/nonexistent-id')
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 404 Not Found response
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  // Test case: GET /loads/status/counts should return status counts
  it('GET /loads/status/counts should return status counts', async () => {
    // LD1: Send a GET request to /api/loads/status/counts with authentication
    const response = await supertest(app)
      .get('/api/v1/loads/status/counts')
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains status counts
    expect(response.body).toBeDefined();
    expect(response.body[LoadStatus.CREATED]).toBeDefined();
  });

  // Test case: GET /loads/:loadId/locations should return load locations
  it('GET /loads/:loadId/locations should return load locations', async () => {
    // LD1: Send a GET request to /api/loads/{testLoadId}/locations with authentication
    const response = await supertest(app)
      .get(`/api/v1/loads/${testLoadId}/locations`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains an array of load locations
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test case: GET /loads/:loadId/documents should return load documents
  it('GET /loads/:loadId/documents should return load documents', async () => {
    // LD1: Create a test document for the test load
    await createTestDocument(testLoadId);

    // LD1: Send a GET request to /api/loads/{testLoadId}/documents with authentication
    const response = await supertest(app)
      .get(`/api/v1/loads/${testLoadId}/documents`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains an array of load documents
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test case: PUT /status/:loadId should update a load's status
  it("PUT /status/:loadId should update a load's status", async () => {
    // LD1: Send a PUT request to /api/status/{testLoadId} with valid status update data and authentication
    const updateData = {
      status: LoadStatus.IN_TRANSIT,
      updated_by: 'test-user'
    };
    const response = await supertest(app)
      .put(`/api/v1/status/${testLoadId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the updated load
    expect(response.body.load_id).toBe(testLoadId);
    expect(response.body.status).toBe(updateData.status);

    // LD1: Verify that the load status was actually updated in the database
    const updatedLoad = await LoadModel.get(testLoadId);
    expect(updatedLoad?.status).toBe(updateData.status);
  });

  // Test case: PUT /status/:loadId should return 400 for invalid status transition
  it('PUT /status/:loadId should return 400 for invalid status transition', async () => {
    // LD1: Send a PUT request to /api/status/{testLoadId} with invalid status transition data and authentication
    const updateData = {
      status: LoadStatus.COMPLETED, // Invalid transition from CREATED
      updated_by: 'test-user'
    };
    const response = await supertest(app)
      .put(`/api/v1/status/${testLoadId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // LD1: Expect a 400 Bad Request response
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);

    // LD1: Verify that the response body contains error details about the invalid transition
    expect(response.body.message).toBe('Invalid status transition');
  });

  // Test case: GET /status/:loadId/history should return status history
  it('GET /status/:loadId/history should return status history', async () => {
    // LD1: Send a GET request to /api/status/{testLoadId}/history with authentication
    const response = await supertest(app)
      .get(`/api/v1/status/${testLoadId}/history`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains an array of status history records
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test case: GET /status/:loadId/timeline should return status timeline
  it('GET /status/:loadId/timeline should return status timeline', async () => {
    // LD1: Send a GET request to /api/status/{testLoadId}/timeline with authentication
    const response = await supertest(app)
      .get(`/api/v1/status/${testLoadId}/timeline`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains a chronological timeline of status changes
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test case: GET /status/:loadId/current should return current status
  it('GET /status/:loadId/current should return current status', async () => {
    // LD1: Send a GET request to /api/status/{testLoadId}/current with authentication
    const response = await supertest(app)
      .get(`/api/v1/status/${testLoadId}/current`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the current status information
    expect(response.body.status).toBe(LoadStatus.CREATED);
  });

  // Test case: GET /status/transition-rules should return status transition rules
  it('GET /status/transition-rules should return status transition rules', async () => {
    // LD1: Send a GET request to /api/status/transition-rules with authentication
    const response = await supertest(app)
      .get('/api/v1/status/transition-rules')
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the status transition rules
    expect(response.body).toBeDefined();
    expect(response.body[LoadStatus.CREATED]).toBeInstanceOf(Array);
  });

  // Test case: POST /documents/:loadId should upload a document
  it('POST /documents/:loadId should upload a document', async () => {
    // LD1: Prepare a test file for upload
    const filePath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(filePath, 'Test document content');

    // LD1: Send a POST request to /api/documents/{testLoadId} with file attachment and authentication
    const response = await supertest(app)
      .post(`/api/v1/documents/load/${testLoadId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .field('documentType', 'BILL_OF_LADING')
      .attach('file', filePath, 'test-document.pdf');

    // LD1: Expect a 201 Created response
    expect(response.status).toBe(StatusCodes.CREATED);

    // LD1: Verify that the response body contains the created document metadata
    expect(response.body.document_id).toBeDefined();
    expect(response.body.load_id).toBe(testLoadId);

    // LD1: Verify that the document was actually created in the database
    const createdDocument = await LoadDocumentModel.get(response.body.document_id);
    expect(createdDocument).toBeDefined();

    // Clean up the test file and document
    fs.unlinkSync(filePath);
    await LoadDocumentModel.delete(response.body.document_id);
  });

  // Test case: GET /documents/:loadId should return load documents
  it('GET /documents/:loadId should return load documents', async () => {
    // LD1: Create a test document for the test load
    const testDocument = await createTestDocument(testLoadId);

    // LD1: Send a GET request to /api/documents/{testLoadId} with authentication
    const response = await supertest(app)
      .get(`/api/v1/documents/load/${testLoadId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains an array of load documents
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);

    // Clean up the test document
    await LoadDocumentModel.delete(testDocument.document_id);
  });

  // Test case: GET /documents/:documentId should return a document
  it('GET /documents/:documentId should return a document', async () => {
    // LD1: Create a test document for the test load
    const testDocument = await createTestDocument(testLoadId);

    // LD1: Send a GET request to /api/documents/{testDocumentId} with authentication
    const response = await supertest(app)
      .get(`/api/v1/documents/${testDocument.document_id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the document metadata
    expect(response.body.document_id).toBe(testDocument.document_id);

    // Clean up the test document
    await LoadDocumentModel.delete(testDocument.document_id);
  });

  // Test case: PUT /documents/:documentId should update document metadata
  it('PUT /documents/:documentId should update document metadata', async () => {
    // LD1: Create a test document for the test load
    const testDocument = await createTestDocument(testLoadId);

    // LD1: Send a PUT request to /api/documents/{testDocumentId} with update data and authentication
    const updateData = {
      filename: 'updated-test-document.pdf',
      documentType: 'PROOF_OF_DELIVERY'
    };
    const response = await supertest(app)
      .put(`/api/v1/documents/${testDocument.document_id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.OK);

    // LD1: Verify that the response body contains the updated document metadata
    expect(response.body.document_id).toBe(testDocument.document_id);
    expect(response.body.filename).toBe(updateData.filename);
    expect(response.body.document_type).toBe(updateData.documentType);

    // LD1: Verify that the document was actually updated in the database
    const updatedDocument = await LoadDocumentModel.get(testDocument.document_id);
    expect(updatedDocument?.filename).toBe(updateData.filename);
    expect(updatedDocument?.document_type).toBe(updateData.documentType);

    // Clean up the test document
    await LoadDocumentModel.delete(testDocument.document_id);
  });

  // Test case: DELETE /documents/:documentId should delete a document
  it('DELETE /documents/:documentId should delete a document', async () => {
    // LD1: Create a test document for deletion
    const testDocument = await createTestDocument(testLoadId);
    const tempDocumentId = testDocument.document_id;

    // LD1: Send a DELETE request to /api/documents/{tempDocumentId} with authentication
    const response = await supertest(app)
      .delete(`/api/v1/documents/${tempDocumentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // LD1: Expect a 200 OK response
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    // LD1: Verify that the document was actually deleted from the database
    const deletedDocument = await LoadDocumentModel.get(tempDocumentId);
    expect(deletedDocument).toBeUndefined();
  });

  // Test case: Requests without authentication should return 401
  it('Requests without authentication should return 401', async () => {
    // LD1: Send a GET request to /api/loads/{testLoadId} without authentication
    let response = await supertest(app).get(`/api/v1/loads/${testLoadId}`);

    // LD1: Expect a 401 Unauthorized response
    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);

    // LD1: Send a POST request to /api/loads without authentication
    response = await supertest(app).post('/api/v1/loads').send({});

    // LD1: Expect a 401 Unauthorized response
    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });
});