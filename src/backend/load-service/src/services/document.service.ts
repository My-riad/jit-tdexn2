import AWS from 'aws-sdk'; // aws-sdk@^2.1400.0
import path from 'path'; // path@^0.12.7
import mime from 'mime-types'; // mime-types@^2.1.35
import { v4 } from 'uuid'; // uuid@^9.0.0

import {
  LoadDocument,
  LoadDocumentType,
} from '../../../common/interfaces/load.interface';
import { LoadDocumentModel } from '../models/load-document.model';
import {
  createS3Client,
  uploadToS3,
  downloadFromS3,
} from '../../../common/config/aws.config';
import LoadEventsProducer from '../producers/load-events.producer';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { getEnv } from '../../../common/config/environment.config';

// Global constants for S3 bucket and document settings
const S3_BUCKET_NAME = getEnv('S3_DOCUMENT_BUCKET_NAME', 'freight-optimization-documents');
const S3_DOCUMENT_PREFIX = getEnv('S3_DOCUMENT_PREFIX', 'documents/');
const MAX_DOCUMENT_SIZE_MB = parseInt(getEnv('MAX_DOCUMENT_SIZE_MB', '10'));
const ALLOWED_DOCUMENT_TYPES = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'];

/**
 * Service class that provides business logic for document management operations
 */
export class DocumentService {
  private readonly s3Client: AWS.S3;

  /**
   * Creates a new DocumentService instance
   * @param eventsProducer The events producer instance
   */
  constructor(private eventsProducer: LoadEventsProducer) {
    // Store the provided events producer instance
    this.eventsProducer = eventsProducer;

    // Initialize S3 client using createS3Client function
    this.s3Client = createS3Client();
  }

  /**
   * Retrieves a document by its ID
   * @param documentId The document ID to fetch
   * @returns The found document or null if not found
   */
  async getDocumentById(documentId: string): Promise<LoadDocument | null> {
    try {
      // Call LoadDocumentModel.get with the provided document ID
      const document = await LoadDocumentModel.get(documentId);
      // Return the found document or null if not found
      return document || null;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting document by ID: ${documentId}`, { error: error.message });
      throw new AppError(`Error getting document by ID: ${documentId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves all documents associated with a specific load
   * @param loadId The load ID to fetch documents for
   * @returns Array of documents associated with the load
   */
  async getDocumentsByLoadId(loadId: string): Promise<LoadDocument[]> {
    try {
      // Call LoadDocumentModel.getByLoadId with the provided load ID
      const documents = await LoadDocumentModel.getByLoadId(loadId);
      // Return the array of found documents
      return documents;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting documents by load ID: ${loadId}`, { error: error.message });
      throw new AppError(`Error getting documents by load ID: ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves documents of a specific type for a load
   * @param loadId The load ID to fetch documents for
   * @param documentType The type of documents to fetch
   * @returns Array of documents matching the criteria
   */
  async getDocumentsByType(
    loadId: string,
    documentType: LoadDocumentType
  ): Promise<LoadDocument[]> {
    try {
      // Call LoadDocumentModel.getDocumentsByType with the provided load ID and document type
      const documents = await LoadDocumentModel.getDocumentsByType(loadId, documentType);
      // Return the array of found documents
      return documents;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting documents by type for load ID: ${loadId} and type: ${documentType}`, { error: error.message });
      throw new AppError(`Error getting documents by type for load ID: ${loadId} and type: ${documentType}`, { code: ErrorCodes.DATABASE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Uploads a new document for a load
   * @param loadId The ID of the load
   * @param documentType The type of document
   * @param fileBuffer The file buffer
   * @param filename The filename
   * @param contentType The content type
   * @param uploadedBy The user who uploaded the document
   * @returns The created document
   */
  async uploadDocument(
    loadId: string,
    documentType: LoadDocumentType,
    fileBuffer: Buffer,
    filename: string,
    contentType: string,
    uploadedBy: string
  ): Promise<LoadDocument> {
    try {
      // Validate file size against MAX_DOCUMENT_SIZE_MB
      if (fileBuffer.byteLength > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
        throw new AppError(`File size exceeds the maximum allowed size of ${MAX_DOCUMENT_SIZE_MB} MB`, { code: ErrorCodes.VALIDATION_ERROR });
      }

      // Validate file extension against ALLOWED_DOCUMENT_TYPES
      if (!this.validateFileType(filename)) {
        throw new AppError(`Invalid file type. Allowed types are: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, { code: ErrorCodes.VALIDATION_ERROR });
      }

      // Generate a unique S3 key using loadId, documentType, and a UUID
      const s3Key = this.generateS3Key(loadId, documentType, filename);

      // Upload the file to S3 using uploadToS3 function
      await uploadToS3(S3_BUCKET_NAME, s3Key, fileBuffer, { ContentType: contentType });

      // Create document metadata record in database using LoadDocumentModel.create
      const documentData: Omit<LoadDocument, 'document_id' | 'created_at' | 'updated_at'> = {
        load_id: loadId,
        document_type: documentType,
        filename: filename,
        content_type: contentType,
        storage_url: `s3://${S3_BUCKET_NAME}/${s3Key}`,
        uploaded_by: uploadedBy,
        uploaded_at: new Date()
      };
      const createdDocument = await LoadDocumentModel.create(documentData);

      // Publish a load document added event using the events producer
      await this.eventsProducer.createLoadDocumentAddedEvent(loadId, createdDocument);

      // Return the created document
      return createdDocument;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error uploading document for load ID: ${loadId}`, { error: error.message });
      throw new AppError(`Error uploading document for load ID: ${loadId}`, { code: ErrorCodes.STORAGE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Generates a pre-signed URL for downloading a document
   * @param documentId The ID of the document
   * @param expirationSeconds The expiration time in seconds
   * @returns Pre-signed URL for document download
   */
  async getDocumentDownloadUrl(documentId: string, expirationSeconds: number): Promise<string> {
    try {
      // Retrieve document metadata using getDocumentById
      const document = await this.getDocumentById(documentId);

      // If document not found, throw NOT_FOUND error
      if (!document) {
        throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND });
      }

      // Generate a pre-signed URL using S3 getSignedUrlPromise with 'getObject' operation
      const params = {
        Bucket: S3_BUCKET_NAME,
        Key: document.storage_url.replace(`s3://${S3_BUCKET_NAME}/`, ''),
        Expires: expirationSeconds
      };
      const url = await this.s3Client.getSignedUrlPromise('getObject', params);

      // Return the pre-signed URL
      return url;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting download URL for document ID: ${documentId}`, { error: error.message });
      throw new AppError(`Error getting download URL for document ID: ${documentId}`, { code: ErrorCodes.STORAGE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Updates document metadata
   * @param documentId The ID of the document to update
   * @param updateData The data to update
   * @returns The updated document or null if not found
   */
  async updateDocument(
    documentId: string,
    updateData: Partial<Omit<LoadDocument, 'document_id' | 'load_id' | 'created_at' | 'updated_at'>>
  ): Promise<LoadDocument | null> {
    try {
      // Call LoadDocumentModel.update with the document ID and update data
      const updatedDocument = await LoadDocumentModel.update(documentId, updateData);

      // If document is found and updated, publish a load document updated event
      if (updatedDocument) {
        await this.eventsProducer.createLoadDocumentUpdatedEvent(updatedDocument.load_id, updatedDocument);
      }

      // Return the updated document or null if not found
      return updatedDocument || null;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error updating document with ID: ${documentId}`, { error: error.message });
      throw new AppError(`Error updating document with ID: ${documentId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Replaces an existing document's file while maintaining the same document ID
   * @param documentId The ID of the document to replace
   * @param fileBuffer The new file buffer
   * @param filename The new filename
   * @param contentType The new content type
   * @param uploadedBy The user who uploaded the document
   * @returns The updated document or null if not found
   */
  async replaceDocument(
    documentId: string,
    fileBuffer: Buffer,
    filename: string,
    contentType: string,
    uploadedBy: string
  ): Promise<LoadDocument | null> {
    try {
      // Retrieve existing document using getDocumentById
      const existingDocument = await this.getDocumentById(documentId);

      // If document not found, throw NOT_FOUND error
      if (!existingDocument) {
        throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND });
      }

      // Validate file size against MAX_DOCUMENT_SIZE_MB
      if (fileBuffer.byteLength > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
        throw new AppError(`File size exceeds the maximum allowed size of ${MAX_DOCUMENT_SIZE_MB} MB`, { code: ErrorCodes.VALIDATION_ERROR });
      }

      // Validate file extension against ALLOWED_DOCUMENT_TYPES
      if (!this.validateFileType(filename)) {
        throw new AppError(`Invalid file type. Allowed types are: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, { code: ErrorCodes.VALIDATION_ERROR });
      }

      // Upload the new file to S3 using the same S3 key
      const s3Key = existingDocument.storage_url.replace(`s3://${S3_BUCKET_NAME}/`, '');
      await uploadToS3(S3_BUCKET_NAME, s3Key, fileBuffer, { ContentType: contentType });

      // Update document metadata in database
      const updateData: Partial<Omit<LoadDocument, 'document_id' | 'load_id' | 'created_at' | 'updated_at'>> = {
        filename: filename,
        content_type: contentType,
        uploaded_by: uploadedBy,
        uploaded_at: new Date()
      };
      const updatedDocument = await LoadDocumentModel.update(documentId, updateData);

      // Publish a load document updated event
      if (updatedDocument) {
        await this.eventsProducer.createLoadDocumentUpdatedEvent(updatedDocument.load_id, updatedDocument);
      }

      // Return the updated document
      return updatedDocument || null;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error replacing document with ID: ${documentId}`, { error: error.message });
      throw new AppError(`Error replacing document with ID: ${documentId}`, { code: ErrorCodes.STORAGE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Deletes a document by its ID
   * @param documentId The ID of the document to delete
   * @returns True if document was deleted, false if not found
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Retrieve document metadata using getDocumentById
      const document = await this.getDocumentById(documentId);

      // If document not found, return false
      if (!document) {
        return false;
      }

      // Delete the file from S3 using deleteObject operation
      const s3Key = document.storage_url.replace(`s3://${S3_BUCKET_NAME}/`, '');
      await this.s3Client.deleteObject({ Bucket: S3_BUCKET_NAME, Key: s3Key }).promise();

      // Delete document metadata from database using LoadDocumentModel.delete
      const deleted = await LoadDocumentModel.delete(documentId);

      // Publish a load document deleted event
      if (deleted) {
        await this.eventsProducer.createLoadDocumentDeletedEvent(document.load_id);
      }

      // Return true if document was deleted
      return deleted;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error deleting document with ID: ${documentId}`, { error: error.message });
      throw new AppError(`Error deleting document with ID: ${documentId}`, { code: ErrorCodes.STORAGE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Deletes all documents associated with a specific load
   * @param loadId The load ID to delete documents for
   * @returns Number of documents deleted
   */
  async deleteDocumentsByLoadId(loadId: string): Promise<number> {
    try {
      // Retrieve all documents for the load using getDocumentsByLoadId
      const documents = await this.getDocumentsByLoadId(loadId);

      // For each document, delete the file from S3
      for (const document of documents) {
        const s3Key = document.storage_url.replace(`s3://${S3_BUCKET_NAME}/`, '');
        await this.s3Client.deleteObject({ Bucket: S3_BUCKET_NAME, Key: s3Key }).promise();
      }

      // Delete all document metadata from database using LoadDocumentModel.deleteByLoadId
      const deletedCount = await LoadDocumentModel.deleteByLoadId(loadId);

      // Return the number of documents deleted
      return deletedCount;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error deleting documents for load ID: ${loadId}`, { error: error.message });
      throw new AppError(`Error deleting documents for load ID: ${loadId}`, { code: ErrorCodes.STORAGE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Retrieves the actual content of a document
   * @param documentId The ID of the document
   * @returns Document content with metadata
   */
  async getDocumentContent(documentId: string): Promise<{ content: Buffer; contentType: string; filename: string }> {
    try {
      // Retrieve document metadata using getDocumentById
      const document = await this.getDocumentById(documentId);

      // If document not found, throw NOT_FOUND error
      if (!document) {
        throw new AppError(`Document with ID ${documentId} not found`, { code: ErrorCodes.NOT_FOUND });
      }

      // Download the file from S3 using downloadFromS3 function
      const s3Object = await downloadFromS3(S3_BUCKET_NAME, document.storage_url.replace(`s3://${S3_BUCKET_NAME}/`, ''));

      // Return the file content along with content type and filename
      return {
        content: s3Object.Body as Buffer,
        contentType: document.content_type,
        filename: document.filename
      };
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting document content for document ID: ${documentId}`, { error: error.message });
      throw new AppError(`Error getting document content for document ID: ${documentId}`, { code: ErrorCodes.STORAGE_ERROR, details: { error: error.message } });
    }
  }

  /**
   * Validates if a file type is allowed
   * @param filename The filename
   * @returns True if file type is allowed, false otherwise
   */
  validateFileType(filename: string): boolean {
    // Extract file extension from filename
    const ext = path.extname(filename).toLowerCase();

    // Check if extension is in ALLOWED_DOCUMENT_TYPES list
    return ALLOWED_DOCUMENT_TYPES.includes(ext);
  }

  /**
   * Generates a unique S3 key for a document
   * @param loadId The ID of the load
   * @param documentType The type of document
   * @param filename The filename
   * @returns Unique S3 key for the document
   */
  generateS3Key(loadId: string, documentType: LoadDocumentType, filename: string): string {
    // Generate a UUID
    const uuid = v4();

    // Combine S3_DOCUMENT_PREFIX, loadId, documentType, UUID, and filename
    return `${S3_DOCUMENT_PREFIX}${loadId}/${documentType}/${uuid}${path.extname(filename).toLowerCase()}`;
  }
}