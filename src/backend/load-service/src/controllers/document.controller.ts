import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import multer from 'multer'; // multer@^1.4.5-lts.1
import Joi from 'joi'; // joi@^17.9.2

import { DocumentService } from '../services/document.service';
import { LoadDocumentType, LoadDocument } from '../../../common/interfaces/load.interface';
import LoadEventsProducer from '../producers/load-events.producer';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import logger from '../../../common/utils/logger';

/**
 * Joi validation schema for document ID parameter
 * Ensures that the document ID is a valid UUID
 */
export const documentIdParamSchema = Joi.object({
  documentId: Joi.string().uuid().required()
});

/**
 * Joi validation schema for load ID parameter
 * Ensures that the load ID is a valid UUID
 */
export const loadIdParamSchema = Joi.object({
  loadId: Joi.string().uuid().required()
});

/**
 * Joi validation schema for document upload
 * Validates the presence and type of required fields for document upload
 */
export const uploadDocumentSchema = Joi.object({
  documentType: Joi.string().valid(...Object.values(LoadDocumentType)).required(),
  file: Joi.object().required() // Multer handles file validation separately
});

/**
 * Joi validation schema for document update
 * Validates the fields that can be updated for a document
 */
export const updateDocumentSchema = Joi.object({
  filename: Joi.string().min(1).max(255),
  documentType: Joi.string().valid(...Object.values(LoadDocumentType)),
}).min(1); // At least one field must be present

/**
 * Joi validation schema for download URL query
 * Validates the expiration time for the download URL
 */
export const downloadUrlQuerySchema = Joi.object({
  expirationTime: Joi.number().integer().min(60).max(3600).default(300) // Default 5 minutes
});

/**
 * Multer middleware for file uploads
 * Configured to handle a single file upload with the name 'file'
 */
export const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file');

/**
 * Controller function to retrieve a document by ID
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const getDocumentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    // Call documentService.getDocumentById with the document ID
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const document = await documentService.getDocumentById(documentId);

    // If document is not found, return 404 Not Found response
    if (!document) {
      logger.warn(`Document with ID ${documentId} not found`);
      throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
    }

    // Return 200 OK response with the document data
    res.status(StatusCodes.OK).json(document);
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in getDocumentById controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to retrieve all documents for a load
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const getDocumentsByLoadId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract load ID from request parameters
    const { loadId } = req.params;

    // Call documentService.getDocumentsByLoadId with the load ID
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const documents = await documentService.getDocumentsByLoadId(loadId);

    // Return 200 OK response with the array of documents
    res.status(StatusCodes.OK).json(documents);
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in getDocumentsByLoadId controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to retrieve documents of a specific type
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const getDocumentsByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract load ID from request parameters
    const { loadId } = req.params;

    // Extract document type from request query parameters
    const documentType = req.query.documentType as LoadDocumentType;

    // Call documentService.getDocumentsByType with the load ID and document type
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const documents = await documentService.getDocumentsByType(loadId, documentType);

    // Return 200 OK response with the array of documents
    res.status(StatusCodes.OK).json(documents);
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in getDocumentsByType controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to upload a new document
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract load ID from request parameters
    const { loadId } = req.params;

    // Extract document type, file buffer, filename, and content type from request
    const { documentType } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded', { code: ErrorCodes.VALIDATION_ERROR, statusCode: StatusCodes.BAD_REQUEST });
    }

    const fileBuffer = file.buffer;
    const filename = file.originalname;
    const contentType = file.mimetype;

    // Extract user ID from authenticated request (example)
    const userId = req.headers['user-id'] as string; // Replace with actual user ID retrieval

    // Call documentService.uploadDocument with the extracted data
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const createdDocument = await documentService.uploadDocument(
      loadId,
      documentType,
      fileBuffer,
      filename,
      contentType,
      userId
    );

    // Return 201 Created response with the created document data
    res.status(StatusCodes.CREATED).json(createdDocument);
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in uploadDocument controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to generate document download URL
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const getDocumentDownloadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    // Extract expiration time from request query parameters (with default value)
    const { expirationTime } = req.query;
    const expirationSeconds = Number(expirationTime);

    // Call documentService.getDocumentDownloadUrl with document ID and expiration time
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const downloadUrl = await documentService.getDocumentDownloadUrl(documentId, expirationSeconds);

    // Return 200 OK response with the download URL
    res.status(StatusCodes.OK).json({ url: downloadUrl });
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in getDocumentDownloadUrl controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to update document metadata
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const updateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    // Extract update data from request body
    const updateData = req.body;

    // Call documentService.updateDocument with document ID and update data
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const updatedDocument = await documentService.updateDocument(documentId, updateData);

    // If document is not found, return 404 Not Found response
    if (!updatedDocument) {
      logger.warn(`Document with ID ${documentId} not found`);
      throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
    }

    // Return 200 OK response with the updated document data
    res.status(StatusCodes.OK).json(updatedDocument);
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in updateDocument controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to replace a document file
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const replaceDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    // Extract file buffer, filename, and content type from request
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded', { code: ErrorCodes.VALIDATION_ERROR, statusCode: StatusCodes.BAD_REQUEST });
    }

    const fileBuffer = file.buffer;
    const filename = file.originalname;
    const contentType = file.mimetype;

    // Extract user ID from authenticated request (example)
    const userId = req.headers['user-id'] as string; // Replace with actual user ID retrieval

    // Call documentService.replaceDocument with the extracted data
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const updatedDocument = await documentService.replaceDocument(
      documentId,
      fileBuffer,
      filename,
      contentType,
      userId
    );

    // If document is not found, return 404 Not Found response
    if (!updatedDocument) {
      logger.warn(`Document with ID ${documentId} not found`);
      throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
    }

    // Return 200 OK response with the updated document data
    res.status(StatusCodes.OK).json(updatedDocument);
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in replaceDocument controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to delete a document
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    // Call documentService.deleteDocument with the document ID
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const deleted = await documentService.deleteDocument(documentId);

    // If document is not found, return 404 Not Found response
    if (!deleted) {
      logger.warn(`Document with ID ${documentId} not found`);
      throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
    }

    // Return 204 No Content response on successful deletion
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in deleteDocument controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to delete all documents for a load
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const deleteDocumentsByLoadId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract load ID from request parameters
    const { loadId } = req.params;

    // Call documentService.deleteDocumentsByLoadId with the load ID
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const deletedCount = await documentService.deleteDocumentsByLoadId(loadId);

    // Return 200 OK response with the number of documents deleted
    res.status(StatusCodes.OK).json({ deletedCount });
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in deleteDocumentsByLoadId controller', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Controller function to download a document directly
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract document ID from request parameters
    const { documentId } = req.params;

    // Call documentService.getDocumentContent with the document ID
    const documentService = new DocumentService(new LoadEventsProducer()); // Corrected instantiation
    const documentContent = await documentService.getDocumentContent(documentId);

    // If document is not found, return 404 Not Found response
    if (!documentContent) {
      logger.warn(`Document with ID ${documentId} not found`);
      throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND, statusCode: StatusCodes.NOT_FOUND });
    }

    // Set appropriate content type header based on document's content type
    res.setHeader('Content-Type', documentContent.contentType);

    // Set content disposition header for download with original filename
    res.setHeader('Content-Disposition', `attachment; filename="${documentContent.filename}"`);

    // Send the document content as the response body
    res.status(StatusCodes.OK).send(documentContent.content);
  } catch (error: any) {
    // Handle and pass any errors to the error middleware
    logger.error('Error in downloadDocument controller', { error: error.message, stack: error.stack });
    next(error);
  }
};