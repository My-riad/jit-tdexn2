import * as tf from '@tensorflow/tfjs-node'; // @tensorflow/tfjs-node@4.10.0
import * as fs from 'fs-extra'; // fs-extra@11.1.1
import * as path from 'path'; // path@0.12.7
import * as semver from 'semver'; // semver@7.5.4

import { 
  ModelType, 
  getSageMakerEndpointName, 
  getModelArtifactPath, 
  invokeEndpoint,
  checkEndpointStatus,
  USE_SAGEMAKER,
  LOCAL_MODEL_PATH
} from '../../../common/config/sagemaker.config';
import { getEnv } from '../../../common/config/environment.config';
import logger from '../../../common/utils/logger';

/**
 * Time-to-live for cached models in milliseconds
 * Default: 1 hour (3600000 ms)
 */
const MODEL_REGISTRY_CACHE_TTL = getEnv('MODEL_REGISTRY_CACHE_TTL', '3600000');

/**
 * Regex pattern for semantic versioning
 */
const MODEL_VERSION_PATTERN = '^\\d+\\.\\d+\\.\\d+$';

/**
 * Default model version to use when none is specified
 */
const DEFAULT_MODEL_VERSION = 'latest';

/**
 * Interface defining metadata structure for machine learning models
 */
export interface ModelMetadata {
  modelType: string;
  version: string;
  createdAt: Date;
  metrics?: {
    accuracy?: number;
    loss?: number;
    [key: string]: any;
  };
  parameters?: {
    [key: string]: any;
  };
  description?: string;
  tags?: string[];
}

/**
 * Validates that the provided model type is a valid ModelType
 * 
 * @param modelType - Type of model to validate
 * @returns True if valid, throws error otherwise
 */
export function validateModelType(modelType: string): boolean {
  if (Object.values(ModelType).includes(modelType as ModelType)) {
    return true;
  }

  const validTypes = Object.values(ModelType).join(', ');
  throw new Error(`Invalid model type: ${modelType}. Must be one of: ${validTypes}`);
}

/**
 * Validates that the provided model version follows semantic versioning format
 * 
 * @param version - Model version to validate
 * @returns True if valid, throws error otherwise
 */
export function validateModelVersion(version: string): boolean {
  // Special case for 'latest' version
  if (version === 'latest') {
    return true;
  }

  // Remove 'v' prefix if it exists
  const versionString = version.startsWith('v') ? version.substring(1) : version;
  
  // Validate against semantic versioning pattern
  if (new RegExp(MODEL_VERSION_PATTERN).test(versionString)) {
    return true;
  }

  throw new Error(
    `Invalid model version: ${version}. Version must follow semantic versioning (e.g., 1.0.0).`
  );
}

/**
 * Constructs the file system path for a local model
 * 
 * @param modelType - Type of model
 * @param version - Model version
 * @returns Full path to the model directory
 */
export function getModelPath(modelType: string, version: string): string {
  validateModelType(modelType);
  validateModelVersion(version);

  return path.join(LOCAL_MODEL_PATH, modelType, version);
}

/**
 * Compares two semantic version strings
 * 
 * @param version1 - First version
 * @param version2 - Second version
 * @returns 1 if version1 > version2, -1 if version1 < version2, 0 if equal
 */
export function compareVersions(version1: string, version2: string): number {
  return semver.compare(
    version1.startsWith('v') ? version1.substring(1) : version1,
    version2.startsWith('v') ? version2.substring(1) : version2
  );
}

/**
 * Loads a model from the local file system
 * 
 * @param modelType - Type of model to load
 * @param version - Version of model to load
 * @returns Promise resolving to the loaded model
 */
async function loadLocalModel(modelType: string, version: string): Promise<any> {
  try {
    const modelPath = getModelPath(modelType, version);
    
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model not found at path: ${modelPath}`);
    }

    // Look for model.json (for LayersModel) or saved_model (for GraphModel)
    const modelJsonPath = path.join(modelPath, 'model.json');
    const savedModelPath = path.join(modelPath, 'saved_model');
    
    let model;
    
    if (fs.existsSync(modelJsonPath)) {
      model = await tf.loadLayersModel(`file://${modelJsonPath}`);
      logger.info(`Loaded TensorFlow LayersModel from ${modelJsonPath}`);
    } else if (fs.existsSync(savedModelPath)) {
      model = await tf.loadGraphModel(`file://${savedModelPath}`);
      logger.info(`Loaded TensorFlow GraphModel from ${savedModelPath}`);
    } else {
      throw new Error(`No model files found in ${modelPath}`);
    }

    // Load metadata if it exists
    const metadataPath = path.join(modelPath, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = await fs.readJson(metadataPath);
        model.metadata = metadata;
      } catch (metadataError) {
        logger.warn(`Failed to load model metadata from ${metadataPath}`, { error: metadataError });
      }
    }

    return model;
  } catch (error) {
    logger.error(`Failed to load local model: ${modelType}@${version}`, { error });
    throw error;
  }
}

/**
 * Loads a model from AWS SageMaker
 * 
 * @param modelType - Type of model to load
 * @param version - Version of model to load
 * @returns Promise resolving to the SageMaker model reference
 */
async function loadSageMakerModel(modelType: string, version: string): Promise<any> {
  try {
    const endpointName = getSageMakerEndpointName(modelType, version);
    
    // Check if the endpoint is available
    const isEndpointAvailable = await checkEndpointStatus(endpointName);
    
    if (!isEndpointAvailable) {
      throw new Error(`SageMaker endpoint not available: ${endpointName}`);
    }
    
    // Create a reference to the SageMaker model
    // This doesn't actually load the model, but provides a reference for making predictions
    const modelReference = {
      endpointName,
      modelType,
      version,
      predict: async (input: any, options: any = {}) => {
        return invokeEndpoint(endpointName, input, options);
      }
    };
    
    logger.info(`Created reference to SageMaker model: ${modelType}@${version}`);
    return modelReference;
  } catch (error) {
    logger.error(`Failed to load SageMaker model: ${modelType}@${version}`, { error });
    throw error;
  }
}

/**
 * Class that manages the registration, retrieval, and versioning of machine learning models
 */
export class ModelRegistry {
  private modelCache: Map<string, Map<string, any>> = new Map();
  private latestVersions: Map<string, string> = new Map();
  private config: {
    useSagemaker: boolean;
    localModelPath: string;
    cacheTtl: number;
    enableCaching: boolean;
  };

  /**
   * Initializes the ModelRegistry with configuration options
   * 
   * @param options - Configuration options
   */
  constructor(options: {
    useSagemaker?: boolean;
    localModelPath?: string;
    cacheTtl?: number;
    enableCaching?: boolean;
  } = {}) {
    // Set default configuration
    this.config = {
      useSagemaker: USE_SAGEMAKER,
      localModelPath: LOCAL_MODEL_PATH,
      cacheTtl: parseInt(MODEL_REGISTRY_CACHE_TTL),
      enableCaching: true
    };

    // Override defaults with provided options
    if (options) {
      if (options.useSagemaker !== undefined) this.config.useSagemaker = options.useSagemaker;
      if (options.localModelPath) this.config.localModelPath = options.localModelPath;
      if (options.cacheTtl) this.config.cacheTtl = options.cacheTtl;
      if (options.enableCaching !== undefined) this.config.enableCaching = options.enableCaching;
    }

    // Initialize model storage directory if using local storage
    if (!this.config.useSagemaker) {
      try {
        fs.ensureDirSync(this.config.localModelPath);
        logger.info(`Initialized model registry with local path: ${this.config.localModelPath}`);
      } catch (error) {
        logger.error(`Failed to initialize model storage directory: ${this.config.localModelPath}`, { error });
        throw error;
      }
    }
  }

  /**
   * Registers a model with the registry
   * 
   * @param model - The model to register
   * @param modelType - Type of model
   * @param version - Version of model
   * @param metadata - Additional model metadata
   */
  async registerModel(
    model: any,
    modelType: string,
    version: string,
    metadata: Partial<ModelMetadata> = {}
  ): Promise<void> {
    try {
      validateModelType(modelType);
      validateModelVersion(version);

      const formattedVersion = version.startsWith('v') ? version : `v${version}`;

      if (!this.config.useSagemaker) {
        // For local storage, save the model to disk
        const modelDir = path.join(this.config.localModelPath, modelType, formattedVersion);
        fs.ensureDirSync(modelDir);

        // Save model based on its type
        if (model.save) {
          // TensorFlow.js model
          await model.save(`file://${modelDir}`);
        } else {
          // Custom or non-TensorFlow model
          await fs.writeJson(path.join(modelDir, 'model.json'), model);
        }

        // Save metadata
        const modelMetadata: ModelMetadata = {
          modelType,
          version: formattedVersion,
          createdAt: new Date(),
          ...metadata
        };
        
        await fs.writeJson(path.join(modelDir, 'metadata.json'), modelMetadata);
        logger.info(`Saved model to ${modelDir}`);
      } else {
        // For SageMaker, registration would involve additional steps
        logger.info(`Model registration for SageMaker: ${modelType}@${formattedVersion}`);
        // Additional SageMaker registration logic would go here
        // This might involve working with the SageMaker API to register the model
      }

      // Update latest version if this is newer
      const currentLatest = this.latestVersions.get(modelType);
      if (!currentLatest || !semver.valid(currentLatest) || 
          compareVersions(formattedVersion, currentLatest) > 0) {
        this.latestVersions.set(modelType, formattedVersion);
        logger.info(`Updated latest version for ${modelType} to ${formattedVersion}`);
      }

      // Add to cache if caching is enabled
      if (this.config.enableCaching) {
        if (!this.modelCache.has(modelType)) {
          this.modelCache.set(modelType, new Map());
        }
        this.modelCache.get(modelType)?.set(formattedVersion, {
          model,
          timestamp: Date.now(),
          metadata: {
            modelType,
            version: formattedVersion,
            createdAt: new Date(),
            ...metadata
          }
        });
      }

      logger.info(`Registered model: ${modelType}@${formattedVersion}`);
    } catch (error) {
      logger.error(`Failed to register model: ${modelType}@${version}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves a model from the registry
   * 
   * @param modelType - Type of model to retrieve
   * @param version - Version of model to retrieve, defaults to 'latest'
   * @returns Promise resolving to the requested model
   */
  async getModel(modelType: string, version: string = DEFAULT_MODEL_VERSION): Promise<any> {
    try {
      validateModelType(modelType);

      // Resolve 'latest' version if specified
      let resolvedVersion = version;
      if (version === 'latest') {
        resolvedVersion = await this.getLatestModelVersion(modelType);
      }

      // Ensure version is prefixed with 'v'
      const formattedVersion = resolvedVersion.startsWith('v') ? resolvedVersion : `v${resolvedVersion}`;

      // Check if model is in cache
      const modelTypeCache = this.modelCache.get(modelType);
      const cachedEntry = modelTypeCache?.get(formattedVersion);

      if (this.config.enableCaching && cachedEntry) {
        const ageMs = Date.now() - cachedEntry.timestamp;
        
        // Return cached model if it's still fresh
        if (ageMs < this.config.cacheTtl) {
          logger.debug(`Retrieved model from cache: ${modelType}@${formattedVersion}`);
          return cachedEntry.model;
        } else {
          // Remove expired cache entry
          modelTypeCache.delete(formattedVersion);
          logger.debug(`Cache expired for model: ${modelType}@${formattedVersion}`);
        }
      }

      // Load model based on storage type
      let model;
      if (this.config.useSagemaker) {
        model = await loadSageMakerModel(modelType, formattedVersion);
      } else {
        model = await loadLocalModel(modelType, formattedVersion);
      }

      // Cache the loaded model
      if (this.config.enableCaching) {
        if (!this.modelCache.has(modelType)) {
          this.modelCache.set(modelType, new Map());
        }
        this.modelCache.get(modelType)?.set(formattedVersion, {
          model,
          timestamp: Date.now(),
          metadata: model.metadata
        });
      }

      logger.info(`Retrieved model: ${modelType}@${formattedVersion}`);
      return model;
    } catch (error) {
      logger.error(`Failed to get model: ${modelType}@${version}`, { error });
      throw error;
    }
  }

  /**
   * Gets the latest available version for a specific model type
   * 
   * @param modelType - Type of model
   * @returns Promise resolving to the latest version string
   */
  async getLatestModelVersion(modelType: string): Promise<string> {
    try {
      validateModelType(modelType);

      // Check if we already have the latest version cached
      if (this.latestVersions.has(modelType)) {
        return this.latestVersions.get(modelType) as string;
      }

      let latestVersion = 'v1.0.0'; // Default if no versions found
      
      if (this.config.useSagemaker) {
        // For SageMaker, we would query the SageMaker API
        // This is a placeholder - actual implementation would use SageMaker SDK
        logger.info(`Finding latest version for model type ${modelType} in SageMaker`);
        // SageMaker implementation would go here
      } else {
        // For local storage, scan the model directory
        const modelTypeDir = path.join(this.config.localModelPath, modelType);
        
        if (fs.existsSync(modelTypeDir)) {
          const versions = fs.readdirSync(modelTypeDir)
            .filter(dir => {
              try {
                // Validate format and convert to semver for comparison
                return validateModelVersion(dir);
              } catch (e) {
                return false;
              }
            });

          if (versions.length > 0) {
            // Sort versions to find the latest
            versions.sort((a, b) => compareVersions(b, a));
            latestVersion = versions[0];
            logger.debug(`Found latest version ${latestVersion} for model type ${modelType}`);
          }
        } else {
          logger.warn(`No model directory found for type: ${modelType}`);
        }
      }

      // Cache the result
      this.latestVersions.set(modelType, latestVersion);
      return latestVersion;
    } catch (error) {
      logger.error(`Failed to get latest model version for ${modelType}`, { error });
      throw error;
    }
  }

  /**
   * Lists all available versions for a specific model type
   * 
   * @param modelType - Type of model
   * @returns Promise resolving to array of available versions
   */
  async listModelVersions(modelType: string): Promise<string[]> {
    try {
      validateModelType(modelType);
      let versions: string[] = [];

      if (this.config.useSagemaker) {
        // For SageMaker, we would query the SageMaker API
        // This is a placeholder - actual implementation would use SageMaker SDK
        logger.info(`Listing versions for model type ${modelType} in SageMaker`);
        // SageMaker implementation would go here
      } else {
        // For local storage, scan the model directory
        const modelTypeDir = path.join(this.config.localModelPath, modelType);
        
        if (fs.existsSync(modelTypeDir)) {
          versions = fs.readdirSync(modelTypeDir)
            .filter(dir => {
              try {
                // Validate format
                return validateModelVersion(dir);
              } catch (e) {
                return false;
              }
            });

          logger.debug(`Found ${versions.length} versions for model type ${modelType}`);
        } else {
          logger.warn(`No model directory found for type: ${modelType}`);
        }
      }

      // Sort versions
      versions.sort((a, b) => compareVersions(b, a));
      return versions;
    } catch (error) {
      logger.error(`Failed to list model versions for ${modelType}`, { error });
      throw error;
    }
  }

  /**
   * Deletes a model from the registry
   * 
   * @param modelType - Type of model to delete
   * @param version - Version of model to delete
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteModel(modelType: string, version: string): Promise<boolean> {
    try {
      validateModelType(modelType);
      validateModelVersion(version);

      const formattedVersion = version.startsWith('v') ? version : `v${version}`;

      if (this.config.useSagemaker) {
        // For SageMaker, we would use the SageMaker API to deregister the model
        logger.info(`Deleting model ${modelType}@${formattedVersion} from SageMaker`);
        // SageMaker implementation would go here
      } else {
        // For local storage, delete the model directory
        const modelDir = path.join(this.config.localModelPath, modelType, formattedVersion);
        
        if (fs.existsSync(modelDir)) {
          fs.removeSync(modelDir);
          logger.info(`Deleted model directory: ${modelDir}`);
        } else {
          logger.warn(`Model directory not found: ${modelDir}`);
          return false;
        }
      }

      // Remove from cache if present
      if (this.modelCache.has(modelType)) {
        this.modelCache.get(modelType)?.delete(formattedVersion);
      }

      // Update latest version if we deleted the latest
      if (this.latestVersions.get(modelType) === formattedVersion) {
        this.latestVersions.delete(modelType);
        // We'll let getLatestModelVersion re-discover the latest when needed
      }

      return true;
    } catch (error) {
      logger.error(`Failed to delete model: ${modelType}@${version}`, { error });
      throw error;
    }
  }

  /**
   * Clears the model cache
   * 
   * @param modelType - Optional model type to clear cache for specific type only
   */
  clearCache(modelType?: string): void {
    if (modelType) {
      validateModelType(modelType);
      this.modelCache.delete(modelType);
      logger.info(`Cleared cache for model type: ${modelType}`);
    } else {
      this.modelCache.clear();
      logger.info('Cleared entire model cache');
    }
  }

  /**
   * Performs inference using a specified model
   * 
   * @param modelType - Type of model to use for prediction
   * @param input - Input data for prediction
   * @param version - Model version to use, defaults to 'latest'
   * @param options - Additional options for prediction
   * @returns Promise resolving to prediction results
   */
  async predict(
    modelType: string,
    input: any,
    version: string = DEFAULT_MODEL_VERSION,
    options: any = {}
  ): Promise<any> {
    try {
      validateModelType(modelType);

      // Resolve 'latest' version if specified
      let resolvedVersion = version;
      if (version === 'latest') {
        resolvedVersion = await this.getLatestModelVersion(modelType);
      }

      // Get the model
      const model = await this.getModel(modelType, resolvedVersion);

      if (this.config.useSagemaker) {
        // For SageMaker, use the model reference's predict method
        return model.predict(input, options);
      } else {
        // For local TensorFlow models
        if (model.predict) {
          // Convert input to tensor
          let tensorInput;
          if (input instanceof tf.Tensor) {
            tensorInput = input;
          } else if (Array.isArray(input)) {
            tensorInput = tf.tensor(input);
          } else {
            tensorInput = tf.tensor([input]);
          }

          // Run prediction
          const result = model.predict(tensorInput);
          
          // Convert result to JavaScript value
          let outputData;
          if (result instanceof tf.Tensor) {
            outputData = await result.array();
            // Clean up tensors
            tensorInput.dispose();
            result.dispose();
          } else {
            outputData = result;
          }

          return outputData;
        } else {
          throw new Error(`Model does not support predict method: ${modelType}@${resolvedVersion}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to run prediction for model: ${modelType}@${version}`, { error });
      throw error;
    }
  }

  /**
   * Compares the performance of two model versions
   * 
   * @param modelType - Type of model to compare
   * @param version1 - First model version
   * @param version2 - Second model version
   * @param testData - Test data for comparison
   * @returns Promise resolving to comparison results
   */
  async compareModelPerformance(
    modelType: string,
    version1: string,
    version2: string,
    testData: {
      inputs: any[];
      expectedOutputs?: any[];
    }
  ): Promise<{ better: string, metrics: Record<string, any> }> {
    try {
      validateModelType(modelType);
      validateModelVersion(version1);
      validateModelVersion(version2);

      const formattedVersion1 = version1.startsWith('v') ? version1 : `v${version1}`;
      const formattedVersion2 = version2.startsWith('v') ? version2 : `v${version2}`;

      logger.info(`Comparing models: ${modelType}@${formattedVersion1} vs ${modelType}@${formattedVersion2}`);

      // Load both models
      const model1 = await this.getModel(modelType, formattedVersion1);
      const model2 = await this.getModel(modelType, formattedVersion2);

      // Run predictions with both models
      const predictions1 = [];
      const predictions2 = [];

      for (const input of testData.inputs) {
        predictions1.push(await this.predict(modelType, input, formattedVersion1));
        predictions2.push(await this.predict(modelType, input, formattedVersion2));
      }

      // Calculate metrics for both models
      const metrics1: Record<string, any> = {};
      const metrics2: Record<string, any> = {};

      // If expected outputs are provided, calculate accuracy and other metrics
      if (testData.expectedOutputs) {
        let correct1 = 0;
        let correct2 = 0;

        for (let i = 0; i < testData.inputs.length; i++) {
          // Simplified accuracy calculation - would be more sophisticated in production
          if (this.compareOutputs(predictions1[i], testData.expectedOutputs[i])) {
            correct1++;
          }
          if (this.compareOutputs(predictions2[i], testData.expectedOutputs[i])) {
            correct2++;
          }
        }

        metrics1.accuracy = correct1 / testData.inputs.length;
        metrics2.accuracy = correct2 / testData.inputs.length;
      }

      // Determine which model is better
      let better: string;
      if (metrics1.accuracy !== undefined && metrics2.accuracy !== undefined) {
        better = metrics1.accuracy >= metrics2.accuracy ? formattedVersion1 : formattedVersion2;
      } else {
        // If no clear metric, default to newer version
        better = compareVersions(formattedVersion1, formattedVersion2) >= 0 ? formattedVersion1 : formattedVersion2;
      }

      return {
        better,
        metrics: {
          [formattedVersion1]: metrics1,
          [formattedVersion2]: metrics2
        }
      };
    } catch (error) {
      logger.error(`Failed to compare model performance: ${modelType}`, { error });
      throw error;
    }
  }

  /**
   * Simple helper method to compare model outputs
   * In a real implementation, this would be more sophisticated and domain-specific
   * 
   * @param output1 - First output
   * @param output2 - Second output
   * @returns True if outputs are considered equivalent
   */
  private compareOutputs(output1: any, output2: any): boolean {
    // Simple implementation - would need to be adapted based on model output type
    if (Array.isArray(output1) && Array.isArray(output2)) {
      if (output1.length !== output2.length) return false;
      
      for (let i = 0; i < output1.length; i++) {
        if (Array.isArray(output1[i]) && Array.isArray(output2[i])) {
          if (!this.compareOutputs(output1[i], output2[i])) return false;
        } else if (output1[i] !== output2[i]) {
          return false;
        }
      }
      return true;
    }
    
    return output1 === output2;
  }
}

// Create a singleton instance
export const modelRegistry = new ModelRegistry();