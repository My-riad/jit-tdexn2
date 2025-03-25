/**
 * SageMaker Configuration
 * 
 * Centralized configuration module for AWS SageMaker integration in the AI-driven Freight Optimization Platform.
 * This file provides utilities for managing machine learning models, endpoints, and inference operations through SageMaker,
 * supporting the platform's AI-driven optimization capabilities.
 */

import AWS from 'aws-sdk'; // aws-sdk@2.1400.0
import { getEnv, requireEnv } from './environment.config';
import logger from '../utils/logger';
import { createSageMakerClient, createSageMakerRuntimeClient } from './aws.config';

// Define model types used in the platform
export enum ModelType {
  DEMAND_PREDICTION = 'demand-prediction',
  SUPPLY_PREDICTION = 'supply-prediction',
  NETWORK_OPTIMIZATION = 'network-optimization',
  DRIVER_BEHAVIOR = 'driver-behavior',
  PRICE_OPTIMIZATION = 'price-optimization',
}

// Global configuration variables
export const SAGEMAKER_ENDPOINT_PREFIX = getEnv('SAGEMAKER_ENDPOINT_PREFIX', 'freight-optimization');
export const SAGEMAKER_MODEL_BUCKET = getEnv('SAGEMAKER_MODEL_BUCKET', 'freight-optimization-models');
export const SAGEMAKER_REGION = getEnv('SAGEMAKER_REGION', 'us-east-1');
export const USE_SAGEMAKER = getEnv('USE_SAGEMAKER', 'false') === 'true';
export const LOCAL_MODEL_PATH = getEnv('LOCAL_MODEL_PATH', './models');

// SageMaker configuration interface
export interface SageMakerConfig {
  region: string;
  endpointPrefix: string;
  modelBucket: string;
  useSageMaker: boolean;
  localModelPath: string;
}

// Model configuration interface for deployment
export interface ModelConfig {
  instanceType: string;
  instanceCount: number;
  environmentVariables: Record<string, string>;
  modelDataUrl: string;
}

/**
 * Constructs a standardized SageMaker endpoint name based on model type and version
 * 
 * @param modelType - The type of machine learning model
 * @param version - The version of the model
 * @returns Fully qualified SageMaker endpoint name
 */
export const getSageMakerEndpointName = (modelType: string, version: string): string => {
  // Validate model type
  if (!Object.values(ModelType).includes(modelType as ModelType)) {
    logger.warn(`Invalid model type: ${modelType}`);
  }
  
  // Format version string (remove 'v' prefix if exists and ensure proper format)
  const formattedVersion = version.startsWith('v') ? version : `v${version}`;
  
  // Construct endpoint name
  return `${SAGEMAKER_ENDPOINT_PREFIX}-${modelType}-${formattedVersion}`;
};

/**
 * Constructs the S3 path for model artifacts based on model type and version
 * 
 * @param modelType - The type of machine learning model
 * @param version - The version of the model
 * @returns S3 URI for model artifacts
 */
export const getModelArtifactPath = (modelType: string, version: string): string => {
  // Validate model type
  if (!Object.values(ModelType).includes(modelType as ModelType)) {
    logger.warn(`Invalid model type: ${modelType}`);
  }
  
  // Format version string (remove 'v' prefix if exists and ensure proper format)
  const formattedVersion = version.startsWith('v') ? version : `v${version}`;
  
  // Construct S3 URI
  return `s3://${SAGEMAKER_MODEL_BUCKET}/${modelType}/${formattedVersion}/model.tar.gz`;
};

/**
 * Retrieves the latest available version for a specific model type
 * 
 * @param modelType - The type of machine learning model
 * @returns Promise resolving to the latest version string
 */
export const getLatestModelVersion = async (modelType: string): Promise<string> => {
  try {
    // Validate model type
    if (!Object.values(ModelType).includes(modelType as ModelType)) {
      logger.warn(`Invalid model type: ${modelType}`);
    }
    
    const sagemakerClient = createSageMakerClient({ region: SAGEMAKER_REGION });
    
    // List models filtered by the given model type
    const listModelsResponse = await sagemakerClient.listModels({
      NameContains: `${SAGEMAKER_ENDPOINT_PREFIX}-${modelType}`,
      SortBy: 'CreationTime',
      SortOrder: 'Descending',
    }).promise();
    
    // Extract version information from model names
    const versionRegex = new RegExp(`${SAGEMAKER_ENDPOINT_PREFIX}-${modelType}-v(\\d+\\.\\d+\\.\\d+)$`);
    const versions: string[] = [];
    
    listModelsResponse.Models?.forEach(model => {
      const match = model.ModelName?.match(versionRegex);
      if (match && match[1]) {
        versions.push(match[1]);
      }
    });
    
    // Sort versions to find the latest one
    if (versions.length > 0) {
      // Sort versions in descending order (latest first)
      versions.sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
          if (aParts[i] !== bParts[i]) {
            return bParts[i] - aParts[i];
          }
        }
        
        return 0;
      });
      
      logger.info(`Latest version for model type ${modelType}: v${versions[0]}`);
      return `v${versions[0]}`;
    }
    
    // If no versions found, return default
    logger.info(`No versions found for model type ${modelType}, returning default v1.0.0`);
    return 'v1.0.0';
  } catch (error) {
    logger.error(`Failed to get latest model version for ${modelType}`, { error });
    return 'v1.0.0';
  }
};

/**
 * Invokes a SageMaker endpoint for model inference
 * 
 * @param endpointName - The name of the SageMaker endpoint to invoke
 * @param payload - The input data for inference
 * @param options - Additional options for the inference request
 * @returns Promise resolving to inference results
 */
export const invokeEndpoint = async (
  endpointName: string,
  payload: any,
  options: {
    contentType?: string;
    accept?: string;
  } = {}
): Promise<any> => {
  try {
    const sagemakerRuntime = createSageMakerRuntimeClient({ region: SAGEMAKER_REGION });
    
    // Prepare request parameters
    const params: AWS.SageMakerRuntime.InvokeEndpointInput = {
      EndpointName: endpointName,
      Body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      ContentType: options.contentType || 'application/json',
      Accept: options.accept || 'application/json',
    };
    
    logger.debug(`Invoking SageMaker endpoint: ${endpointName}`, { 
      contentType: params.ContentType,
      payloadSize: params.Body.length
    });
    
    // Invoke the endpoint
    const response = await sagemakerRuntime.invokeEndpoint(params).promise();
    
    // Parse the response
    if (!response.Body) {
      throw new Error('Empty response body received from SageMaker endpoint');
    }
    
    const responseBody = response.Body.toString();
    
    // Try to parse as JSON if contentType is JSON
    if (response.ContentType?.includes('json')) {
      try {
        return JSON.parse(responseBody);
      } catch (parseError) {
        logger.warn('Failed to parse JSON response from SageMaker', { parseError });
        return responseBody;
      }
    }
    
    return responseBody;
  } catch (error) {
    logger.error(`Failed to invoke SageMaker endpoint: ${endpointName}`, { error });
    throw error;
  }
};

/**
 * Checks if a SageMaker endpoint is available and ready for inference
 * 
 * @param endpointName - The name of the SageMaker endpoint to check
 * @returns Promise resolving to true if endpoint is available
 */
export const checkEndpointStatus = async (endpointName: string): Promise<boolean> => {
  try {
    const sagemakerClient = createSageMakerClient({ region: SAGEMAKER_REGION });
    
    // Describe the endpoint to get its status
    const response = await sagemakerClient.describeEndpoint({
      EndpointName: endpointName
    }).promise();
    
    // Check if the endpoint is in service
    const isAvailable = response.EndpointStatus === 'InService';
    
    if (isAvailable) {
      logger.debug(`SageMaker endpoint ${endpointName} is available`);
    } else {
      logger.info(`SageMaker endpoint ${endpointName} status: ${response.EndpointStatus}`);
    }
    
    return isAvailable;
  } catch (error) {
    if ((error as AWS.AWSError).code === 'ValidationException') {
      logger.info(`SageMaker endpoint ${endpointName} does not exist`);
      return false;
    }
    
    logger.error(`Failed to check status of SageMaker endpoint: ${endpointName}`, { error });
    return false;
  }
};

/**
 * Creates a new SageMaker endpoint for a model
 * 
 * @param modelName - The name of the model to deploy
 * @param endpointConfigName - The name of the endpoint configuration
 * @param endpointName - The name of the endpoint to create
 * @returns Promise resolving to the endpoint ARN
 */
export const createEndpoint = async (
  modelName: string,
  endpointConfigName: string,
  endpointName: string
): Promise<string> => {
  try {
    const sagemakerClient = createSageMakerClient({ region: SAGEMAKER_REGION });
    
    // Check if endpoint config exists, create if not
    try {
      await sagemakerClient.describeEndpointConfig({
        EndpointConfigName: endpointConfigName
      }).promise();
      
      logger.info(`Endpoint configuration ${endpointConfigName} already exists`);
    } catch (error) {
      if ((error as AWS.AWSError).code === 'ValidationException') {
        // Create endpoint configuration
        logger.info(`Creating endpoint configuration: ${endpointConfigName}`);
        await sagemakerClient.createEndpointConfig({
          EndpointConfigName: endpointConfigName,
          ProductionVariants: [
            {
              VariantName: 'AllTraffic',
              ModelName: modelName,
              InitialInstanceCount: 1,
              InstanceType: 'ml.m5.large',
              InitialVariantWeight: 1.0
            }
          ]
        }).promise();
        
        logger.info(`Created endpoint configuration: ${endpointConfigName}`);
      } else {
        throw error;
      }
    }
    
    // Check if endpoint exists
    let endpointExists = false;
    try {
      await sagemakerClient.describeEndpoint({
        EndpointName: endpointName
      }).promise();
      endpointExists = true;
      logger.info(`Endpoint ${endpointName} already exists, updating...`);
    } catch (error) {
      if ((error as AWS.AWSError).code !== 'ValidationException') {
        throw error;
      }
    }
    
    // Create or update endpoint
    if (endpointExists) {
      // Update existing endpoint
      const updateResponse = await sagemakerClient.updateEndpoint({
        EndpointName: endpointName,
        EndpointConfigName: endpointConfigName
      }).promise();
      
      logger.info(`Updated endpoint: ${endpointName}`, { endpointArn: updateResponse.EndpointArn });
      return updateResponse.EndpointArn as string;
    } else {
      // Create new endpoint
      const createResponse = await sagemakerClient.createEndpoint({
        EndpointName: endpointName,
        EndpointConfigName: endpointConfigName
      }).promise();
      
      logger.info(`Created endpoint: ${endpointName}`, { endpointArn: createResponse.EndpointArn });
      return createResponse.EndpointArn as string;
    }
  } catch (error) {
    logger.error(`Failed to create/update SageMaker endpoint: ${endpointName}`, { error });
    throw error;
  }
};

/**
 * Deletes a SageMaker endpoint
 * 
 * @param endpointName - The name of the SageMaker endpoint to delete
 * @returns Promise resolving to true if deletion was successful
 */
export const deleteEndpoint = async (endpointName: string): Promise<boolean> => {
  try {
    const sagemakerClient = createSageMakerClient({ region: SAGEMAKER_REGION });
    
    // Delete the endpoint
    await sagemakerClient.deleteEndpoint({
      EndpointName: endpointName
    }).promise();
    
    logger.info(`Deleted SageMaker endpoint: ${endpointName}`);
    return true;
  } catch (error) {
    if ((error as AWS.AWSError).code === 'ValidationException') {
      logger.info(`SageMaker endpoint ${endpointName} does not exist, nothing to delete`);
      return true;
    }
    
    logger.error(`Failed to delete SageMaker endpoint: ${endpointName}`, { error });
    return false;
  }
};

/**
 * Lists all available SageMaker endpoints with optional filtering
 * 
 * @param nameContains - Optional string to filter endpoint names by
 * @returns Promise resolving to list of endpoint descriptions
 */
export const listEndpoints = async (
  nameContains?: string
): Promise<AWS.SageMaker.DescribeEndpointOutput[]> => {
  try {
    const sagemakerClient = createSageMakerClient({ region: SAGEMAKER_REGION });
    
    // List endpoints with optional filtering
    const listParams: AWS.SageMaker.ListEndpointsInput = {};
    if (nameContains) {
      listParams.NameContains = nameContains;
    }
    
    const listResponse = await sagemakerClient.listEndpoints(listParams).promise();
    
    // Get detailed information for each endpoint
    const endpointDetails: AWS.SageMaker.DescribeEndpointOutput[] = [];
    
    if (listResponse.Endpoints && listResponse.Endpoints.length > 0) {
      // Get detailed information for each endpoint
      for (const endpoint of listResponse.Endpoints) {
        if (endpoint.EndpointName) {
          try {
            const detailedInfo = await sagemakerClient.describeEndpoint({
              EndpointName: endpoint.EndpointName
            }).promise();
            
            endpointDetails.push(detailedInfo);
          } catch (detailError) {
            logger.warn(`Failed to get details for endpoint: ${endpoint.EndpointName}`, { detailError });
          }
        }
      }
    }
    
    logger.info(`Listed ${endpointDetails.length} SageMaker endpoints`);
    return endpointDetails;
  } catch (error) {
    logger.error('Failed to list SageMaker endpoints', { error });
    return [];
  }
};

/**
 * Registers a model with SageMaker
 * 
 * @param modelName - The name for the registered model
 * @param modelArtifactPath - S3 path to model artifacts
 * @param options - Additional options for model registration
 * @returns Promise resolving to the model ARN
 */
export const registerModel = async (
  modelName: string,
  modelArtifactPath: string,
  options: {
    executionRoleArn?: string;
    image?: string;
    environmentVariables?: Record<string, string>;
  } = {}
): Promise<string> => {
  try {
    const sagemakerClient = createSageMakerClient({ region: SAGEMAKER_REGION });
    
    // Prepare model creation parameters
    const params: AWS.SageMaker.CreateModelInput = {
      ModelName: modelName,
      PrimaryContainer: {
        Image: options.image || `${requireEnv('AWS_ACCOUNT_ID')}.dkr.ecr.${SAGEMAKER_REGION}.amazonaws.com/sagemaker-tensorflow-serving:2.6.3-cpu`,
        ModelDataUrl: modelArtifactPath,
        Environment: options.environmentVariables
      },
      ExecutionRoleArn: options.executionRoleArn || requireEnv('SAGEMAKER_ROLE_ARN')
    };
    
    // Create the model
    const response = await sagemakerClient.createModel(params).promise();
    
    logger.info(`Registered SageMaker model: ${modelName}`, { modelArn: response.ModelArn });
    return response.ModelArn as string;
  } catch (error) {
    logger.error(`Failed to register SageMaker model: ${modelName}`, { error });
    throw error;
  }
};

/**
 * Deregisters a model from SageMaker
 * 
 * @param modelName - The name of the model to deregister
 * @returns Promise resolving to true if deregistration was successful
 */
export const deregisterModel = async (modelName: string): Promise<boolean> => {
  try {
    const sagemakerClient = createSageMakerClient({ region: SAGEMAKER_REGION });
    
    // Delete the model
    await sagemakerClient.deleteModel({
      ModelName: modelName
    }).promise();
    
    logger.info(`Deregistered SageMaker model: ${modelName}`);
    return true;
  } catch (error) {
    if ((error as AWS.AWSError).code === 'ValidationException') {
      logger.info(`SageMaker model ${modelName} does not exist, nothing to deregister`);
      return true;
    }
    
    logger.error(`Failed to deregister SageMaker model: ${modelName}`, { error });
    return false;
  }
};

/**
 * Creates a model configuration for deployment
 * 
 * @param modelType - The type of machine learning model
 * @param version - The version of the model
 * @param config - Additional configuration options
 * @returns Model configuration object
 */
export const createModelConfig = (
  modelType: string,
  version: string,
  config: Partial<ModelConfig> = {}
): ModelConfig => {
  // Validate model type
  if (!Object.values(ModelType).includes(modelType as ModelType)) {
    logger.warn(`Invalid model type: ${modelType}`);
  }
  
  // Format version string
  const formattedVersion = version.startsWith('v') ? version : `v${version}`;
  
  // Create configuration with defaults
  const modelConfig: ModelConfig = {
    instanceType: config.instanceType || 'ml.m5.large',
    instanceCount: config.instanceCount || 1,
    environmentVariables: config.environmentVariables || {},
    modelDataUrl: getModelArtifactPath(modelType, formattedVersion)
  };
  
  return modelConfig;
};