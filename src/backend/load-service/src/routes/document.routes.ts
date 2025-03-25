import express, { Router } from 'express'; // express@^4.18.2
const router = express.Router();

import { authenticate } from '../../../common/middleware/auth.middleware';
import { validateParams, validateBody, validateQuery } from '../../../common/middleware/validation.middleware';
import {
  getDocumentById,
  getDocumentsByLoadId,
  getDocumentsByType,
  uploadDocument,
  getDocumentDownloadUrl,
  updateDocument,
  replaceDocument,
  deleteDocument,
  deleteDocumentsByLoadId,
  downloadDocument,
  documentIdParamSchema,
  loadIdParamSchema,
  uploadDocumentSchema,
  updateDocumentSchema,
  downloadUrlQuerySchema,
  uploadMiddleware
} from '../controllers/document.controller';

/**
 * Creates and configures the Express router for document-related endpoints
 * @returns Configured Express router with document routes
 */
function createDocumentRouter(): Router {
  // Create a new Express router instance
  const router = express.Router();

  // Define routes for document operations with appropriate middleware
  // All document routes require authentication
  router.use(authenticate);

  // Configure route for retrieving a document by ID
  // Requires document ID in the URL parameters and validates it against the schema
  router.get('/:documentId', validateParams(documentIdParamSchema), getDocumentById);

  // Configure route for retrieving documents by load ID
  // Requires load ID in the URL parameters and validates it against the schema
  router.get('/load/:loadId', validateParams(loadIdParamSchema), getDocumentsByLoadId);

  // Configure route for retrieving documents by type
  // Requires load ID in the URL parameters and validates it against the schema
  // Requires document type in the query parameters and validates it against the schema
  router.get('/load/:loadId/type', validateParams(loadIdParamSchema), validateQuery(uploadDocumentSchema), getDocumentsByType);

  // Configure route for uploading a new document
  // Requires load ID in the URL parameters and validates it against the schema
  // Requires document type and file in the request body and validates it against the schema
  // Uses multer middleware for handling file uploads
  router.post('/load/:loadId', validateParams(loadIdParamSchema), uploadMiddleware, validateBody(uploadDocumentSchema), uploadDocument);

  // Configure route for generating a document download URL
  // Requires document ID in the URL parameters and validates it against the schema
  // Requires expiration time in the query parameters and validates it against the schema
  router.get('/:documentId/download-url', validateParams(documentIdParamSchema), validateQuery(downloadUrlQuerySchema), getDocumentDownloadUrl);

  // Configure route for downloading a document directly
  // Requires document ID in the URL parameters and validates it against the schema
  router.get('/:documentId/download', validateParams(documentIdParamSchema), downloadDocument);

  // Configure route for updating document metadata
  // Requires document ID in the URL parameters and validates it against the schema
  // Requires update data in the request body and validates it against the schema
  router.patch('/:documentId', validateParams(documentIdParamSchema), validateBody(updateDocumentSchema), updateDocument);

  // Configure route for replacing a document file
  // Requires document ID in the URL parameters and validates it against the schema
  // Requires file in the request body and validates it against the schema
  // Uses multer middleware for handling file uploads
  router.put('/:documentId', validateParams(documentIdParamSchema), uploadMiddleware, replaceDocument);

  // Configure route for deleting a document
  // Requires document ID in the URL parameters and validates it against the schema
  router.delete('/:documentId', validateParams(documentIdParamSchema), deleteDocument);

  // Configure route for deleting all documents for a load
  // Requires load ID in the URL parameters and validates it against the schema
  router.delete('/load/:loadId', validateParams(loadIdParamSchema), deleteDocumentsByLoadId);

  // Return the configured router
  return router;
}

// Export the configured document router for use in the application
export default createDocumentRouter();