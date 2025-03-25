import { Model } from 'objection'; // objection@3.0.1
import { Knex } from 'knex'; // knex@2.4.2
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { LoadDocument, LoadDocumentType } from '../../../common/interfaces/load.interface';
import db from '../../../common/config/database.config';

/**
 * Model class for load documents that maps to the database table and provides CRUD operations
 */
export class LoadDocumentModel extends Model {
  // Properties mapped from the LoadDocument interface
  document_id!: string;
  load_id!: string;
  document_type!: LoadDocumentType;
  filename!: string;
  content_type!: string;
  storage_url!: string;
  uploaded_by!: string;
  uploaded_at!: Date;
  created_at!: Date;
  updated_at!: Date;

  /**
   * Returns the database table name for this model
   */
  static get tableName() {
    return 'load_documents';
  }

  /**
   * Defines the JSON schema for validation of load document objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['load_id', 'document_type', 'filename', 'content_type', 'storage_url', 'uploaded_by'],
      
      properties: {
        document_id: { type: 'string', format: 'uuid' },
        load_id: { type: 'string', format: 'uuid' },
        document_type: { type: 'string', enum: Object.values(LoadDocumentType) },
        filename: { type: 'string', minLength: 1, maxLength: 255 },
        content_type: { type: 'string', minLength: 1, maxLength: 100 },
        storage_url: { type: 'string', minLength: 1, maxLength: 1024 },
        uploaded_by: { type: 'string', minLength: 1, maxLength: 255 },
        uploaded_at: { type: 'string', format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships with other models, particularly the Load model
   */
  static get relationMappings() {
    return {
      load: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/../load.model`,
        join: {
          from: 'load_documents.load_id',
          to: 'loads.load_id'
        }
      }
    };
  }

  /**
   * Retrieves a load document by its ID
   * @param documentId - The document ID to fetch
   * @returns The found document or undefined if not found
   */
  static async get(documentId: string): Promise<LoadDocumentModel | undefined> {
    return this.query()
      .findById(documentId)
      .first();
  }

  /**
   * Retrieves all documents associated with a specific load
   * @param loadId - The load ID to fetch documents for
   * @returns Array of documents associated with the load
   */
  static async getByLoadId(loadId: string): Promise<LoadDocumentModel[]> {
    return this.query()
      .where('load_id', loadId)
      .orderBy('uploaded_at', 'desc');
  }

  /**
   * Creates a new load document in the database
   * @param documentData - The document data to create
   * @returns The newly created document
   */
  static async create(
    documentData: Omit<LoadDocument, 'document_id' | 'created_at' | 'updated_at'>
  ): Promise<LoadDocumentModel> {
    const now = new Date();
    
    const newDocument = {
      ...documentData,
      document_id: documentData.document_id || uuidv4(),
      uploaded_at: documentData.uploaded_at || now,
      created_at: now,
      updated_at: now
    };

    return this.query().insert(newDocument).returning('*');
  }

  /**
   * Updates an existing load document
   * @param documentId - The ID of the document to update
   * @param documentData - The document data to update
   * @returns The updated document or undefined if not found
   */
  static async update(
    documentId: string,
    documentData: Partial<Omit<LoadDocument, 'document_id' | 'load_id' | 'created_at' | 'updated_at'>>
  ): Promise<LoadDocumentModel | undefined> {
    const updateData = {
      ...documentData,
      updated_at: new Date()
    };

    return this.query()
      .patchAndFetchById(documentId, updateData);
  }

  /**
   * Deletes a load document from the database
   * @param documentId - The ID of the document to delete
   * @returns True if document was deleted, false if not found
   */
  static async delete(documentId: string): Promise<boolean> {
    const deleted = await this.query().deleteById(documentId);
    return deleted > 0;
  }

  /**
   * Deletes all documents associated with a specific load
   * @param loadId - The load ID to delete documents for
   * @returns Number of documents deleted
   */
  static async deleteByLoadId(loadId: string): Promise<number> {
    return this.query()
      .delete()
      .where('load_id', loadId);
  }

  /**
   * Retrieves documents of a specific type for a load
   * @param loadId - The load ID to fetch documents for
   * @param documentType - The type of documents to fetch
   * @returns Array of documents matching the criteria
   */
  static async getDocumentsByType(
    loadId: string,
    documentType: LoadDocumentType
  ): Promise<LoadDocumentModel[]> {
    return this.query()
      .where({
        load_id: loadId,
        document_type: documentType
      })
      .orderBy('uploaded_at', 'desc');
  }
}

// Initialize the model with the knex instance
Model.knex(db.knex);