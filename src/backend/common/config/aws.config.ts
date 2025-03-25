/**
 * AWS Configuration Utility
 * 
 * Centralized AWS configuration utility for the AI-driven Freight Optimization Platform.
 * Provides functions to initialize and configure AWS SDK clients, manage credentials,
 * and create service-specific clients for various AWS services used throughout the application.
 */

import AWS from 'aws-sdk'; // aws-sdk@2.1400.0
import { getEnv, requireEnv } from './environment.config';
import logger from '../utils/logger';

// Global environment variables
export const AWS_REGION = getEnv('AWS_REGION', 'us-east-1');
export const AWS_PROFILE = getEnv('AWS_PROFILE', '');
export const NODE_ENV = getEnv('NODE_ENV', 'development');
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_LOCAL = getEnv('IS_LOCAL', 'false') === 'true';

/**
 * AWS Configuration Interface
 * Defines the structure of AWS configuration settings
 */
export interface AWSConfig {
  region: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    profile?: string;
  };
  s3?: AWS.S3.ClientConfiguration;
  dynamodb?: AWS.DynamoDB.ClientConfiguration;
  sagemaker?: AWS.SageMaker.ClientConfiguration;
  cloudwatch?: AWS.CloudWatch.ClientConfiguration;
  sns?: AWS.SNS.ClientConfiguration;
  sqs?: AWS.SQS.ClientConfiguration;
  secretsManager?: AWS.SecretsManager.ClientConfiguration;
}

/**
 * Configures the AWS SDK with appropriate credentials and region settings
 * 
 * @param options - Optional configuration options
 */
export const configureAWS = (options: Partial<AWSConfig> = {}): void => {
  try {
    // Set the AWS region
    const region = options.region || AWS_REGION;
    AWS.config.update({ region });
    
    // Configure credentials based on environment
    if (IS_LOCAL && AWS_PROFILE) {
      // Use local credentials with profile when running locally
      AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: AWS_PROFILE });
      logger.info(`AWS SDK configured with local profile: ${AWS_PROFILE}`);
    } else if (options.credentials?.accessKeyId && options.credentials?.secretAccessKey) {
      // Use provided credentials
      AWS.config.credentials = new AWS.Credentials({
        accessKeyId: options.credentials.accessKeyId,
        secretAccessKey: options.credentials.secretAccessKey
      });
      logger.info('AWS SDK configured with provided credentials');
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      // Use environment variables
      AWS.config.credentials = new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      });
      logger.info('AWS SDK configured with environment credentials');
    } else {
      // In production environments, rely on instance roles/container roles
      logger.info('AWS SDK using default credential provider chain');
    }
    
    // Configure logging for development
    if (!IS_PRODUCTION) {
      AWS.config.logger = console;
    }
    
    // Configure retry strategy
    AWS.config.maxRetries = 3;
    
    logger.info(`AWS SDK configured with region: ${region}`);
  } catch (error) {
    logger.error('Failed to configure AWS SDK', { error });
    throw error;
  }
};

/**
 * Creates and returns a configured S3 client
 * 
 * @param options - Optional S3 client configuration options
 * @returns Configured S3 client instance
 */
export const createS3Client = (options: AWS.S3.ClientConfiguration = {}): AWS.S3 => {
  const clientOptions: AWS.S3.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.S3(clientOptions);
};

/**
 * Creates and returns a configured DynamoDB document client
 * 
 * @param options - Optional DynamoDB client configuration options
 * @returns Configured DynamoDB document client instance
 */
export const createDynamoDBClient = (
  options: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.ClientConfiguration = {}
): AWS.DynamoDB.DocumentClient => {
  const clientOptions: AWS.DynamoDB.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.DynamoDB.DocumentClient(clientOptions);
};

/**
 * Creates and returns a configured SageMaker client
 * 
 * @param options - Optional SageMaker client configuration options
 * @returns Configured SageMaker client instance
 */
export const createSageMakerClient = (options: AWS.SageMaker.ClientConfiguration = {}): AWS.SageMaker => {
  const clientOptions: AWS.SageMaker.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.SageMaker(clientOptions);
};

/**
 * Creates and returns a configured SageMaker Runtime client for model inference
 * 
 * @param options - Optional SageMaker Runtime client configuration options
 * @returns Configured SageMaker Runtime client instance
 */
export const createSageMakerRuntimeClient = (
  options: AWS.SageMakerRuntime.ClientConfiguration = {}
): AWS.SageMakerRuntime => {
  const clientOptions: AWS.SageMakerRuntime.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.SageMakerRuntime(clientOptions);
};

/**
 * Creates and returns a configured CloudWatch client
 * 
 * @param options - Optional CloudWatch client configuration options
 * @returns Configured CloudWatch client instance
 */
export const createCloudWatchClient = (options: AWS.CloudWatch.ClientConfiguration = {}): AWS.CloudWatch => {
  const clientOptions: AWS.CloudWatch.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.CloudWatch(clientOptions);
};

/**
 * Creates and returns a configured SNS client
 * 
 * @param options - Optional SNS client configuration options
 * @returns Configured SNS client instance
 */
export const createSNSClient = (options: AWS.SNS.ClientConfiguration = {}): AWS.SNS => {
  const clientOptions: AWS.SNS.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.SNS(clientOptions);
};

/**
 * Creates and returns a configured SQS client
 * 
 * @param options - Optional SQS client configuration options
 * @returns Configured SQS client instance
 */
export const createSQSClient = (options: AWS.SQS.ClientConfiguration = {}): AWS.SQS => {
  const clientOptions: AWS.SQS.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.SQS(clientOptions);
};

/**
 * Creates and returns a configured Secrets Manager client
 * 
 * @param options - Optional Secrets Manager client configuration options
 * @returns Configured Secrets Manager client instance
 */
export const createSecretsManagerClient = (
  options: AWS.SecretsManager.ClientConfiguration = {}
): AWS.SecretsManager => {
  const clientOptions: AWS.SecretsManager.ClientConfiguration = {
    region: options.region || AWS_REGION,
    ...options
  };
  
  return new AWS.SecretsManager(clientOptions);
};

/**
 * Retrieves a secret from AWS Secrets Manager
 * 
 * @param secretName - The name or ARN of the secret to retrieve
 * @returns Promise resolving to the secret value
 */
export const getSecret = async (secretName: string): Promise<any> => {
  try {
    const client = createSecretsManagerClient();
    
    const data = await client.getSecretValue({ SecretId: secretName }).promise();
    
    if (data.SecretString) {
      return JSON.parse(data.SecretString);
    }
    
    if (data.SecretBinary) {
      const buff = Buffer.from(data.SecretBinary.toString(), 'base64');
      return JSON.parse(buff.toString('ascii'));
    }
    
    throw new Error('Secret not found or is empty');
  } catch (error) {
    logger.error(`Failed to retrieve secret: ${secretName}`, { error });
    throw error;
  }
};

/**
 * Uploads a file or data to an S3 bucket
 * 
 * @param bucket - The name of the S3 bucket
 * @param key - The key (path) in the bucket
 * @param body - The content to upload
 * @param options - Optional S3 put object parameters
 * @returns Promise resolving to upload result
 */
export const uploadToS3 = async (
  bucket: string,
  key: string,
  body: Buffer | string,
  options: Partial<AWS.S3.PutObjectRequest> = {}
): Promise<AWS.S3.ManagedUpload.SendData> => {
  try {
    const s3 = createS3Client();
    
    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ...options
    };
    
    return await s3.upload(params).promise();
  } catch (error) {
    logger.error(`Failed to upload to S3: ${bucket}/${key}`, { error });
    throw error;
  }
};

/**
 * Downloads a file from an S3 bucket
 * 
 * @param bucket - The name of the S3 bucket
 * @param key - The key (path) in the bucket
 * @returns Promise resolving to the downloaded object
 */
export const downloadFromS3 = async (
  bucket: string,
  key: string
): Promise<AWS.S3.GetObjectOutput> => {
  try {
    const s3 = createS3Client();
    
    const params: AWS.S3.GetObjectRequest = {
      Bucket: bucket,
      Key: key
    };
    
    return await s3.getObject(params).promise();
  } catch (error) {
    logger.error(`Failed to download from S3: ${bucket}/${key}`, { error });
    throw error;
  }
};

/**
 * Returns the complete AWS configuration for the current environment
 * 
 * @returns AWS configuration object
 */
export const getAWSConfig = (): AWSConfig => {
  return {
    region: AWS_REGION,
    credentials: AWS_PROFILE ? { profile: AWS_PROFILE } : undefined,
    // Add service-specific configurations here
    s3: {
      region: AWS_REGION,
      // Use path-style endpoint for local development (e.g., with LocalStack)
      s3ForcePathStyle: IS_LOCAL,
      endpoint: IS_LOCAL ? 'http://localhost:4566' : undefined
    },
    dynamodb: {
      region: AWS_REGION,
      endpoint: IS_LOCAL ? 'http://localhost:4566' : undefined
    },
    sagemaker: {
      region: AWS_REGION
    },
    cloudwatch: {
      region: AWS_REGION
    },
    sns: {
      region: AWS_REGION,
      endpoint: IS_LOCAL ? 'http://localhost:4566' : undefined
    },
    sqs: {
      region: AWS_REGION,
      endpoint: IS_LOCAL ? 'http://localhost:4566' : undefined
    },
    secretsManager: {
      region: AWS_REGION,
      endpoint: IS_LOCAL ? 'http://localhost:4566' : undefined
    }
  };
};