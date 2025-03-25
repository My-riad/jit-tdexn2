/**
 * Machine Learning Model Trainer
 *
 * This module provides functionality for training, evaluating, and deploying machine learning models
 * that power the AI-driven optimization capabilities of the platform. It handles data preparation,
 * model training, performance evaluation, and model registration with the model registry.
 *
 * @module ml/trainer
 */

import * as tf from '@tensorflow/tfjs-node'; // @tensorflow/tfjs-node@4.10.0
import * as fs from 'fs-extra'; // fs-extra@11.1.1
import * as path from 'path'; // path@0.12.7
import * as semver from 'semver'; // semver@7.5.4

import {
  modelRegistry,
  registerModel as registerModelWithRegistry,
  getLatestModelVersion,
  compareModelPerformance
} from './model-registry';

import {
  ModelType,
  getModelArtifactPath,
  registerModel as registerModelWithSageMaker,
  USE_SAGEMAKER,
  LOCAL_MODEL_PATH
} from '../../../common/config/sagemaker.config';

import logger from '../../../common/utils/logger';
import { getEnv } from '../../../common/config/environment.config';
import { getModelConfig } from '../config';

// Default training configuration
const DEFAULT_TRAINING_CONFIG = {
  epochs: 100,
  batchSize: 32,
  validationSplit: 0.2,
  shuffle: true,
  verbose: 1
};

// Default early stopping configuration
const DEFAULT_EARLY_STOPPING_CONFIG = {
  monitor: 'val_loss',
  patience: 10,
  minDelta: 0.001,
  mode: 'min'
};

// Model save format for TensorFlow.js
const MODEL_SAVE_FORMAT = 'tfjs';

// Training data path
const TRAINING_DATA_PATH = getEnv('TRAINING_DATA_PATH', './data/training');

/**
 * Interface defining options for model training operations
 */
export interface TrainingOptions {
  trainingConfig?: {
    epochs?: number;
    batchSize?: number;
    validationSplit?: number;
    shuffle?: boolean;
    verbose?: number;
    [key: string]: any;
  };
  earlyStoppingConfig?: {
    monitor?: string;
    patience?: number;
    minDelta?: number;
    mode?: string;
    [key: string]: any;
  };
  validationSplit?: number;
  testSplit?: number;
  deployAfterTraining?: boolean;
  setAsLatest?: boolean;
  modelParams?: Record<string, any>;
  preprocessOptions?: Record<string, any>;
}

/**
 * Interface defining metadata structure for trained models
 */
export interface ModelMetadata {
  modelType: string;
  version: string;
  createdAt: Date;
  metrics?: Record<string, any>;
  trainingConfig?: Record<string, any>;
  modelArchitecture?: Record<string, any>;
  description?: string;
  tags?: string[];
}

/**
 * Prepares and preprocesses data for model training
 *
 * @param rawData - The raw data to prepare for training
 * @param modelType - The type of model being trained
 * @param options - Data preparation options
 * @returns Promise resolving to prepared training, testing, and validation datasets
 */
export async function prepareTrainingData(
  rawData: any,
  modelType: string,
  options: Record<string, any> = {}
): Promise<{ trainData: any, testData: any, validationData: any }> {
  logger.info(`Preparing training data for model type: ${modelType}`);

  // Validate input data structure
  if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
    throw new Error('Invalid or empty training data provided');
  }

  // Extract options with defaults
  const testSplit = options.testSplit || 0.1;
  const validationSplit = options.validationSplit || 0.2;
  
  // Process data based on model type
  let processedData: any;
  
  try {
    switch (modelType) {
      case ModelType.DEMAND_PREDICTION:
        processedData = prepareDemandPredictionData(rawData, options);
        break;
        
      case ModelType.SUPPLY_PREDICTION:
        processedData = prepareSupplyPredictionData(rawData, options);
        break;
        
      case ModelType.NETWORK_OPTIMIZATION:
        processedData = prepareNetworkOptimizationData(rawData, options);
        break;
        
      case ModelType.DRIVER_BEHAVIOR:
        processedData = prepareDriverBehaviorData(rawData, options);
        break;
        
      case ModelType.PRICE_OPTIMIZATION:
        processedData = preparePriceOptimizationData(rawData, options);
        break;
        
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
    
    // Split data into training, testing, and validation sets
    const dataLength = processedData.inputs.length;
    const testCount = Math.floor(dataLength * testSplit);
    const validationCount = Math.floor(dataLength * validationSplit);
    const trainingCount = dataLength - testCount - validationCount;
    
    // Create splits
    const shuffledIndices = tf.util.createShuffledIndices(dataLength);
    
    // Training data
    const trainIndices = shuffledIndices.slice(0, trainingCount);
    const trainInputs = selectByIndices(processedData.inputs, trainIndices);
    const trainLabels = selectByIndices(processedData.labels, trainIndices);
    
    // Validation data
    const validationIndices = shuffledIndices.slice(trainingCount, trainingCount + validationCount);
    const validationInputs = selectByIndices(processedData.inputs, validationIndices);
    const validationLabels = selectByIndices(processedData.labels, validationIndices);
    
    // Test data
    const testIndices = shuffledIndices.slice(trainingCount + validationCount);
    const testInputs = selectByIndices(processedData.inputs, testIndices);
    const testLabels = selectByIndices(processedData.labels, testIndices);
    
    logger.info(`Data preparation complete. Training: ${trainInputs.length}, Validation: ${validationInputs.length}, Test: ${testInputs.length} samples`);
    
    return {
      trainData: { inputs: trainInputs, labels: trainLabels },
      validationData: { inputs: validationInputs, labels: validationLabels },
      testData: { inputs: testInputs, labels: testLabels }
    };
  } catch (error) {
    logger.error(`Failed to prepare training data for ${modelType}`, { error });
    throw new Error(`Data preparation failed: ${(error as Error).message}`);
  }
}

/**
 * Helper function to select elements from an array by indices
 */
function selectByIndices(array: any[], indices: number[]): any[] {
  return indices.map(i => array[i]);
}

/**
 * Prepare data specifically for demand prediction models
 */
function prepareDemandPredictionData(rawData: any, options: Record<string, any>): { inputs: any[], labels: any[] } {
  // Sample implementation for demand prediction data preparation
  const inputs: any[] = [];
  const labels: any[] = [];
  
  // Extract features related to demand prediction
  for (const record of rawData) {
    // Normalize location, time, and region features
    const features = [
      // Location features (normalized)
      record.origin?.latitude / 90.0 || 0,
      record.origin?.longitude / 180.0 || 0,
      record.destination?.latitude / 90.0 || 0,
      record.destination?.longitude / 180.0 || 0,
      
      // Time features (hour of day, day of week, etc.)
      new Date(record.timestamp).getHours() / 24.0,
      new Date(record.timestamp).getDay() / 7.0,
      
      // Other relevant features like weight, distance, etc.
      record.weight ? record.weight / 50000.0 : 0, // Normalize by typical max weight
      record.distance ? record.distance / 3000.0 : 0, // Normalize by typical max distance
    ];
    
    // Additional features based on options
    if (options.includeSeasonality) {
      const date = new Date(record.timestamp);
      features.push(Math.sin(2 * Math.PI * date.getMonth() / 12)); // Seasonal cycle
      features.push(Math.cos(2 * Math.PI * date.getMonth() / 12));
    }
    
    // Label is typically the demand level or count
    const label = record.demandLevel || record.loadCount || 0;
    
    inputs.push(features);
    labels.push([label]);
  }
  
  return { inputs, labels };
}

/**
 * Prepare data specifically for supply prediction models
 */
function prepareSupplyPredictionData(rawData: any, options: Record<string, any>): { inputs: any[], labels: any[] } {
  // Implementation for supply prediction data preparation
  const inputs: any[] = [];
  const labels: any[] = [];
  
  // Extract features related to supply prediction
  for (const record of rawData) {
    // Normalize driver and truck availability features
    const features = [
      // Location features
      record.location?.latitude / 90.0 || 0,
      record.location?.longitude / 180.0 || 0,
      
      // Time features
      new Date(record.timestamp).getHours() / 24.0,
      new Date(record.timestamp).getDay() / 7.0,
      
      // Driver availability features
      record.availableDrivers ? record.availableDrivers / 100.0 : 0,
      record.hoursOfService ? record.hoursOfService / 11.0 : 0, // Normalize by max HOS
    ];
    
    // Additional features based on options
    if (options.includeHistorical) {
      features.push(record.historicalUtilization || 0);
    }
    
    // Label is typically the available trucks count
    const label = record.availableTrucks || 0;
    
    inputs.push(features);
    labels.push([label]);
  }
  
  return { inputs, labels };
}

/**
 * Prepare data specifically for network optimization models
 */
function prepareNetworkOptimizationData(rawData: any, options: Record<string, any>): { inputs: any[], labels: any[] } {
  // Implementation for network optimization data preparation
  const inputs: any[] = [];
  const labels: any[] = [];
  
  // For network optimization, we might be working with graph-like data
  for (const record of rawData) {
    // This could be more complex in reality, possibly involving graph structures
    const features = [
      // Network state features
      ...record.networkState || [],
      
      // Constraints
      ...record.constraints || [],
      
      // Current efficiency metrics
      record.currentEfficiency || 0,
      record.emptyMilePercentage || 0,
    ];
    
    // Label could be the optimal action or expected efficiency improvement
    const label = record.optimalAction || record.efficiencyImprovement || 0;
    
    inputs.push(features);
    labels.push(Array.isArray(label) ? label : [label]);
  }
  
  return { inputs, labels };
}

/**
 * Prepare data specifically for driver behavior models
 */
function prepareDriverBehaviorData(rawData: any, options: Record<string, any>): { inputs: any[], labels: any[] } {
  // Implementation for driver behavior data preparation
  const inputs: any[] = [];
  const labels: any[] = [];
  
  // Extract features related to driver behavior prediction
  for (const record of rawData) {
    // Encode driver history and preference features
    const features = [
      // Driver characteristics
      ...encodeDriverCharacteristics(record.driverProfile),
      
      // Historical behavior features
      ...encodeDriverHistory(record.driverHistory),
      
      // Current context
      ...encodeCurrentContext(record.context),
    ];
    
    // Label could be the expected driver decision
    const label = encodeDriverDecision(record.decision);
    
    inputs.push(features);
    labels.push(label);
  }
  
  return { inputs, labels };
}

/**
 * Prepare data specifically for price optimization models
 */
function preparePriceOptimizationData(rawData: any, options: Record<string, any>): { inputs: any[], labels: any[] } {
  // Implementation for price optimization data preparation
  const inputs: any[] = [];
  const labels: any[] = [];
  
  // Extract features related to price optimization
  for (const record of rawData) {
    // Normalize route and market condition features
    const features = [
      // Route features
      record.origin?.latitude / 90.0 || 0,
      record.origin?.longitude / 180.0 || 0,
      record.destination?.latitude / 90.0 || 0,
      record.destination?.longitude / 180.0 || 0,
      record.distance ? record.distance / 3000.0 : 0,
      
      // Market conditions
      record.supplyDemandRatio || 1.0,
      record.marketRate ? record.marketRate / 10000.0 : 0, // Normalize by some max rate
      
      // Time features
      new Date(record.timestamp).getHours() / 24.0,
      new Date(record.timestamp).getDay() / 7.0,
    ];
    
    // Label is typically the optimal price
    const label = record.optimalRate || record.acceptedRate || 0;
    
    inputs.push(features);
    labels.push([label]);
  }
  
  return { inputs, labels };
}

/**
 * Helper function to encode driver characteristics
 */
function encodeDriverCharacteristics(profile: any): number[] {
  if (!profile) return Array(10).fill(0); // Default encoding size
  
  // Example: encode driver profile features like experience, preferred regions, etc.
  return [
    profile.experienceYears ? Math.min(profile.experienceYears / 20.0, 1.0) : 0, // Normalize by 20 years
    profile.efficiencyScore ? profile.efficiencyScore / 100.0 : 0,
    profile.onTimeRate ? profile.onTimeRate : 0,
    // Add more relevant features...
  ];
}

/**
 * Helper function to encode driver history
 */
function encodeDriverHistory(history: any): number[] {
  if (!history || !Array.isArray(history)) return Array(10).fill(0); // Default encoding size
  
  // This could be more complex, possibly using sequence encoding techniques
  // For simplicity, we'll just return some aggregate statistics
  const recentHistory = history.slice(0, 10); // Use most recent 10 events
  
  return [
    recentHistory.filter(h => h.acceptedLoad).length / 10.0,
    recentHistory.filter(h => h.onTime).length / 10.0,
    // Add more relevant history features...
  ];
}

/**
 * Helper function to encode current context
 */
function encodeCurrentContext(context: any): number[] {
  if (!context) return Array(5).fill(0); // Default encoding size
  
  // Encode relevant contextual information
  return [
    context.currentLocation?.latitude / 90.0 || 0,
    context.currentLocation?.longitude / 180.0 || 0,
    context.remainingHos ? context.remainingHos / 11.0 : 0, // Normalize by max HOS
    // Add more relevant context features...
  ];
}

/**
 * Helper function to encode driver decision
 */
function encodeDriverDecision(decision: any): number[] {
  if (!decision) return [0]; // Default: no decision
  
  // This could be a categorical encoding of different decision types
  // For simplicity, we'll just return a binary decision
  return [decision.accepted ? 1 : 0];
}

/**
 * Creates a machine learning model architecture based on model type
 *
 * @param modelType - The type of model to create
 * @param inputShape - The shape of input data
 * @param options - Additional options for model creation
 * @returns Promise resolving to the created TensorFlow.js model
 */
export async function createModel(
  modelType: string,
  inputShape: number | number[],
  options: Record<string, any> = {}
): Promise<tf.LayersModel> {
  logger.info(`Creating model architecture for model type: ${modelType}`);
  
  let model: tf.LayersModel;
  
  try {
    // Get input shape as an array
    const inputDimensions = Array.isArray(inputShape) ? inputShape : [inputShape];
    
    switch (modelType) {
      case ModelType.DEMAND_PREDICTION:
        model = createDemandPredictionModel(inputDimensions, options);
        break;
        
      case ModelType.SUPPLY_PREDICTION:
        model = createSupplyPredictionModel(inputDimensions, options);
        break;
        
      case ModelType.NETWORK_OPTIMIZATION:
        model = createNetworkOptimizationModel(inputDimensions, options);
        break;
        
      case ModelType.DRIVER_BEHAVIOR:
        model = createDriverBehaviorModel(inputDimensions, options);
        break;
        
      case ModelType.PRICE_OPTIMIZATION:
        model = createPriceOptimizationModel(inputDimensions, options);
        break;
        
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
    
    logger.info(`Model architecture created successfully for ${modelType}`);
    return model;
  } catch (error) {
    logger.error(`Failed to create model architecture for ${modelType}`, { error });
    throw new Error(`Model creation failed: ${(error as Error).message}`);
  }
}

/**
 * Create a model for demand prediction
 */
function createDemandPredictionModel(inputDimensions: number[], options: Record<string, any>): tf.LayersModel {
  // Get model parameters from options or use defaults
  const layers = options.layers || [64, 32];
  const activation = options.activation || 'relu';
  const finalActivation = options.finalActivation || 'linear';
  
  // Create a sequential model
  const model = tf.sequential();
  
  // Add input layer
  model.add(tf.layers.dense({
    units: layers[0],
    activation,
    inputShape: [inputDimensions[0]] // Input shape must be an array
  }));
  
  // Add hidden layers
  for (let i = 1; i < layers.length; i++) {
    model.add(tf.layers.dense({
      units: layers[i],
      activation
    }));
  }
  
  // Add output layer - typically regression for demand prediction
  model.add(tf.layers.dense({
    units: 1, // Single output for demand level
    activation: finalActivation
  }));
  
  // Compile the model
  model.compile({
    optimizer: options.optimizer || 'adam',
    loss: options.loss || 'meanSquaredError',
    metrics: options.metrics || ['mse']
  });
  
  return model;
}

/**
 * Create a model for supply prediction
 */
function createSupplyPredictionModel(inputDimensions: number[], options: Record<string, any>): tf.LayersModel {
  // Similar to demand prediction model but may have different architecture
  const layers = options.layers || [64, 32];
  const activation = options.activation || 'relu';
  const finalActivation = options.finalActivation || 'linear';
  
  // Create a sequential model
  const model = tf.sequential();
  
  // Add input layer
  model.add(tf.layers.dense({
    units: layers[0],
    activation,
    inputShape: [inputDimensions[0]]
  }));
  
  // Add hidden layers
  for (let i = 1; i < layers.length; i++) {
    model.add(tf.layers.dense({
      units: layers[i],
      activation
    }));
  }
  
  // Add output layer - typically regression for supply prediction
  model.add(tf.layers.dense({
    units: 1, // Single output for supply level
    activation: finalActivation
  }));
  
  // Compile the model
  model.compile({
    optimizer: options.optimizer || 'adam',
    loss: options.loss || 'meanSquaredError',
    metrics: options.metrics || ['mse']
  });
  
  return model;
}

/**
 * Create a model for network optimization
 */
function createNetworkOptimizationModel(inputDimensions: number[], options: Record<string, any>): tf.LayersModel {
  // Network optimization might benefit from a more complex architecture
  const layers = options.layers || [128, 64, 32];
  const activation = options.activation || 'relu';
  const finalActivation = options.finalActivation || 'linear';
  
  // Create a sequential model
  const model = tf.sequential();
  
  // Add input layer
  model.add(tf.layers.dense({
    units: layers[0],
    activation,
    inputShape: [inputDimensions[0]]
  }));
  
  // Add hidden layers
  for (let i = 1; i < layers.length; i++) {
    model.add(tf.layers.dense({
      units: layers[i],
      activation
    }));
    
    // Add dropout for regularization if specified
    if (options.dropout) {
      model.add(tf.layers.dropout({ rate: options.dropout }));
    }
  }
  
  // Add output layer - could be multiple outputs for different optimization parameters
  model.add(tf.layers.dense({
    units: options.outputUnits || 1,
    activation: finalActivation
  }));
  
  // Compile the model
  model.compile({
    optimizer: options.optimizer || 'adam',
    loss: options.loss || 'meanSquaredError',
    metrics: options.metrics || ['mse']
  });
  
  return model;
}

/**
 * Create a model for driver behavior prediction
 */
function createDriverBehaviorModel(inputDimensions: number[], options: Record<string, any>): tf.LayersModel {
  // Driver behavior might benefit from a sequential or recurrent model
  const useLSTM = options.useLSTM || false;
  const layers = options.layers || [64, 32];
  const activation = options.activation || 'relu';
  const finalActivation = options.finalActivation || 'sigmoid'; // Binary classification often uses sigmoid
  
  // Create a sequential model
  const model = tf.sequential();
  
  if (useLSTM) {
    // For sequence data, use LSTM layers
    model.add(tf.layers.lstm({
      units: layers[0],
      returnSequences: layers.length > 1,
      inputShape: inputDimensions as [number, number]
    }));
    
    // Add additional LSTM layers if specified
    for (let i = 1; i < layers.length - 1; i++) {
      model.add(tf.layers.lstm({
        units: layers[i],
        returnSequences: i < layers.length - 2
      }));
    }
    
    // Add a dense output layer
    model.add(tf.layers.dense({
      units: options.outputUnits || 1,
      activation: finalActivation
    }));
  } else {
    // Standard feedforward network
    model.add(tf.layers.dense({
      units: layers[0],
      activation,
      inputShape: [inputDimensions[0]]
    }));
    
    // Add hidden layers
    for (let i = 1; i < layers.length; i++) {
      model.add(tf.layers.dense({
        units: layers[i],
        activation
      }));
    }
    
    // Add output layer - typically binary classification for accept/reject decisions
    model.add(tf.layers.dense({
      units: options.outputUnits || 1,
      activation: finalActivation
    }));
  }
  
  // Compile the model
  model.compile({
    optimizer: options.optimizer || 'adam',
    loss: options.loss || 'binaryCrossentropy',
    metrics: options.metrics || ['accuracy']
  });
  
  return model;
}

/**
 * Create a model for price optimization
 */
function createPriceOptimizationModel(inputDimensions: number[], options: Record<string, any>): tf.LayersModel {
  // Price optimization might use a regression model with market features
  const layers = options.layers || [64, 32];
  const activation = options.activation || 'relu';
  const finalActivation = options.finalActivation || 'linear';
  
  // Create a sequential model
  const model = tf.sequential();
  
  // Add input layer
  model.add(tf.layers.dense({
    units: layers[0],
    activation,
    inputShape: [inputDimensions[0]]
  }));
  
  // Add hidden layers
  for (let i = 1; i < layers.length; i++) {
    model.add(tf.layers.dense({
      units: layers[i],
      activation
    }));
    
    // Add batch normalization if specified
    if (options.batchNorm) {
      model.add(tf.layers.batchNormalization());
    }
  }
  
  // Add output layer - typically regression for price
  model.add(tf.layers.dense({
    units: 1,
    activation: finalActivation
  }));
  
  // Compile the model
  model.compile({
    optimizer: options.optimizer || 'adam',
    loss: options.loss || 'meanSquaredError',
    metrics: options.metrics || ['mse']
  });
  
  return model;
}

/**
 * Trains a machine learning model with the provided data
 *
 * @param model - The model to train
 * @param trainData - Training data
 * @param validationData - Validation data
 * @param trainingConfig - Training configuration options
 * @returns Promise resolving to the trained model and training history
 */
export async function trainModel(
  model: tf.LayersModel,
  trainData: { inputs: any[], labels: any[] },
  validationData: { inputs: any[], labels: any[] },
  trainingConfig: Record<string, any> = {}
): Promise<{ model: tf.LayersModel, history: tf.History }> {
  logger.info('Starting model training');
  
  try {
    // Merge default training config with provided config
    const config = {
      ...DEFAULT_TRAINING_CONFIG,
      ...trainingConfig
    };
    
    // Set up callbacks
    const callbacks: tf.Callback[] = [];
    
    // Add early stopping if configured
    if (trainingConfig.earlyStoppingConfig) {
      const earlyStoppingConfig = {
        ...DEFAULT_EARLY_STOPPING_CONFIG,
        ...trainingConfig.earlyStoppingConfig
      };
      
      callbacks.push(tf.callbacks.earlyStopping(earlyStoppingConfig));
    }
    
    // Convert training data to tensors
    const trainInputs = tf.tensor2d(trainData.inputs);
    const trainLabels = tf.tensor2d(trainData.labels);
    
    // Convert validation data to tensors
    const valInputs = tf.tensor2d(validationData.inputs);
    const valLabels = tf.tensor2d(validationData.labels);
    
    // Train the model
    logger.info(`Training model with ${trainData.inputs.length} samples over ${config.epochs} epochs`);
    const history = await model.fit(trainInputs, trainLabels, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationData: [valInputs, valLabels],
      callbacks,
      verbose: config.verbose
    });
    
    // Clean up tensors
    trainInputs.dispose();
    trainLabels.dispose();
    valInputs.dispose();
    valLabels.dispose();
    
    logger.info('Model training completed successfully');
    return { model, history };
  } catch (error) {
    logger.error('Failed to train model', { error });
    throw new Error(`Model training failed: ${(error as Error).message}`);
  }
}

/**
 * Evaluates a trained model's performance on test data
 *
 * @param model - The trained model to evaluate
 * @param testData - Test data for evaluation
 * @param modelType - The type of model being evaluated
 * @returns Promise resolving to evaluation metrics
 */
export async function evaluateModel(
  model: tf.LayersModel,
  testData: { inputs: any[], labels: any[] },
  modelType: string
): Promise<Record<string, any>> {
  logger.info(`Evaluating model of type: ${modelType}`);
  
  try {
    // Convert test data to tensors
    const testInputs = tf.tensor2d(testData.inputs);
    const testLabels = tf.tensor2d(testData.labels);
    
    // Evaluate the model
    const evaluation = await model.evaluate(testInputs, testLabels) as tf.Scalar[];
    
    // Extract metrics based on the model's compiled configuration
    const metrics: Record<string, any> = {};
    
    // Get loss and metrics
    const metricNames = ['loss', ...(model.metricsNames || [])];
    
    for (let i = 0; i < evaluation.length; i++) {
      const metricName = metricNames[i] || `metric_${i}`;
      metrics[metricName] = await evaluation[i].dataSync()[0];
    }
    
    // Calculate model-specific metrics
    switch (modelType) {
      case ModelType.DEMAND_PREDICTION:
      case ModelType.SUPPLY_PREDICTION:
      case ModelType.PRICE_OPTIMIZATION:
        // Calculate additional regression metrics
        const predictions = model.predict(testInputs) as tf.Tensor;
        metrics.rmse = await calculateRMSE(predictions, testLabels);
        metrics.mae = await calculateMAE(predictions, testLabels);
        metrics.r2 = await calculateR2(predictions, testLabels);
        predictions.dispose();
        break;
        
      case ModelType.DRIVER_BEHAVIOR:
        // Calculate additional classification metrics
        const classPredictions = model.predict(testInputs) as tf.Tensor;
        metrics.precision = await calculatePrecision(classPredictions, testLabels);
        metrics.recall = await calculateRecall(classPredictions, testLabels);
        metrics.f1Score = await calculateF1Score(metrics.precision, metrics.recall);
        classPredictions.dispose();
        break;
        
      case ModelType.NETWORK_OPTIMIZATION:
        // Calculate network efficiency improvement metrics
        const netPredictions = model.predict(testInputs) as tf.Tensor;
        metrics.efficiencyImprovement = await calculateEfficiencyImprovement(netPredictions, testLabels);
        netPredictions.dispose();
        break;
    }
    
    // Clean up tensors
    testInputs.dispose();
    testLabels.dispose();
    evaluation.forEach(e => e.dispose());
    
    logger.info('Model evaluation completed', { metrics });
    return metrics;
  } catch (error) {
    logger.error('Failed to evaluate model', { error });
    throw new Error(`Model evaluation failed: ${(error as Error).message}`);
  }
}

/**
 * Calculate Root Mean Square Error (RMSE)
 */
async function calculateRMSE(predictions: tf.Tensor, labels: tf.Tensor): Promise<number> {
  return tf.tidy(() => {
    const squaredDiff = tf.square(tf.sub(predictions, labels));
    const mean = tf.mean(squaredDiff);
    return Math.sqrt(mean.dataSync()[0]);
  });
}

/**
 * Calculate Mean Absolute Error (MAE)
 */
async function calculateMAE(predictions: tf.Tensor, labels: tf.Tensor): Promise<number> {
  return tf.tidy(() => {
    const absDiff = tf.abs(tf.sub(predictions, labels));
    const mean = tf.mean(absDiff);
    return mean.dataSync()[0];
  });
}

/**
 * Calculate R-squared (R²) coefficient of determination
 */
async function calculateR2(predictions: tf.Tensor, labels: tf.Tensor): Promise<number> {
  return tf.tidy(() => {
    // Total sum of squares
    const labelMean = tf.mean(labels);
    const totalSquareSum = tf.sum(tf.square(tf.sub(labels, labelMean)));
    
    // Residual sum of squares
    const residualSquareSum = tf.sum(tf.square(tf.sub(labels, predictions)));
    
    // R-squared = 1 - (residual sum of squares / total sum of squares)
    const r2 = tf.sub(1, tf.div(residualSquareSum, totalSquareSum));
    
    return r2.dataSync()[0];
  });
}

/**
 * Calculate precision for binary classification
 */
async function calculatePrecision(predictions: tf.Tensor, labels: tf.Tensor): Promise<number> {
  return tf.tidy(() => {
    // Convert predictions to binary (0 or 1)
    const binaryPredictions = tf.greater(predictions, tf.scalar(0.5));
    
    // True positives: prediction=1, label=1
    const truePositives = tf.logicalAnd(binaryPredictions, tf.cast(labels, 'bool'));
    const truePositiveCount = tf.sum(tf.cast(truePositives, 'float32'));
    
    // All predicted positives
    const predictedPositiveCount = tf.sum(tf.cast(binaryPredictions, 'float32'));
    
    // Precision = true positives / all predicted positives
    const precision = tf.div(truePositiveCount, 
      tf.add(predictedPositiveCount, tf.scalar(1e-7))); // Add small epsilon to avoid division by zero
    
    return precision.dataSync()[0];
  });
}

/**
 * Calculate recall for binary classification
 */
async function calculateRecall(predictions: tf.Tensor, labels: tf.Tensor): Promise<number> {
  return tf.tidy(() => {
    // Convert predictions to binary (0 or 1)
    const binaryPredictions = tf.greater(predictions, tf.scalar(0.5));
    
    // True positives: prediction=1, label=1
    const truePositives = tf.logicalAnd(binaryPredictions, tf.cast(labels, 'bool'));
    const truePositiveCount = tf.sum(tf.cast(truePositives, 'float32'));
    
    // All actual positives
    const actualPositiveCount = tf.sum(labels);
    
    // Recall = true positives / all actual positives
    const recall = tf.div(truePositiveCount, 
      tf.add(actualPositiveCount, tf.scalar(1e-7))); // Add small epsilon to avoid division by zero
    
    return recall.dataSync()[0];
  });
}

/**
 * Calculate F1 score from precision and recall
 */
async function calculateF1Score(precision: number, recall: number): Promise<number> {
  // F1 = 2 * (precision * recall) / (precision + recall)
  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
}

/**
 * Calculate efficiency improvement for network optimization
 */
async function calculateEfficiencyImprovement(predictions: tf.Tensor, labels: tf.Tensor): Promise<number> {
  return tf.tidy(() => {
    // This is a simplified example - in practice, this would be more complex
    // and specific to the optimization problem
    
    // Calculate the average predicted improvement
    const avgPredicted = tf.mean(predictions);
    
    // Calculate the average actual improvement
    const avgActual = tf.mean(labels);
    
    // Calculate the ratio of predicted to actual improvement
    const ratio = tf.div(avgPredicted, tf.add(avgActual, tf.scalar(1e-7)));
    
    return ratio.dataSync()[0];
  });
}

/**
 * Saves a trained model to disk or cloud storage
 *
 * @param model - The trained model to save
 * @param modelType - The type of model being saved
 * @param version - The version of the model
 * @param metadata - Additional model metadata
 * @returns Promise resolving to the path where the model was saved
 */
export async function saveModel(
  model: tf.LayersModel,
  modelType: string,
  version: string,
  metadata: Partial<ModelMetadata> = {}
): Promise<string> {
  logger.info(`Saving model of type ${modelType} version ${version}`);
  
  try {
    // Format version to ensure it starts with 'v'
    const formattedVersion = version.startsWith('v') ? version : `v${version}`;
    
    let modelPath: string;
    
    if (USE_SAGEMAKER) {
      // For SageMaker, save to S3
      const s3Path = getModelArtifactPath(modelType, formattedVersion);
      
      // This would require additional implementation for saving to S3
      // We'll assume it's handled by external code for now
      logger.info(`Preparing to save model to SageMaker S3 path: ${s3Path}`);
      
      // Local temporary directory for saving before upload
      const tempDir = path.join(LOCAL_MODEL_PATH, `temp_${modelType}_${formattedVersion}`);
      await fs.ensureDir(tempDir);
      
      // Save locally first
      const localSavePath = `file://${tempDir}`;
      await model.save(localSavePath);
      
      // Then we'd need to package and upload to S3
      // This part would be handled by AWS SDK or specialized code
      
      // Return the S3 path
      modelPath = s3Path;
    } else {
      // For local storage
      const localDir = path.join(LOCAL_MODEL_PATH, modelType, formattedVersion);
      await fs.ensureDir(localDir);
      
      const savePath = `file://${localDir}`;
      await model.save(savePath);
      
      // Save metadata file
      const metadataWithDefaults: ModelMetadata = {
        modelType,
        version: formattedVersion,
        createdAt: new Date(),
        ...metadata
      };
      
      await fs.writeJSON(path.join(localDir, 'metadata.json'), metadataWithDefaults, { spaces: 2 });
      
      modelPath = localDir;
    }
    
    logger.info(`Model saved successfully to ${modelPath}`);
    return modelPath;
  } catch (error) {
    logger.error(`Failed to save model: ${modelType}@${version}`, { error });
    throw new Error(`Model saving failed: ${(error as Error).message}`);
  }
}

/**
 * Generates the next semantic version for a model type
 *
 * @param modelType - The type of model
 * @returns Promise resolving to the next version string
 */
export async function generateNextVersion(modelType: string): Promise<string> {
  try {
    // Get the latest version for the model type
    const latestVersion = await getLatestModelVersion(modelType);
    
    // Remove 'v' prefix if present
    const versionNumber = latestVersion.startsWith('v') 
      ? latestVersion.substring(1) 
      : latestVersion;
    
    // Parse the semantic version
    const parsedVersion = semver.parse(versionNumber);
    
    if (!parsedVersion) {
      // If parsing fails, start with version 1.0.0
      logger.info(`Could not parse existing version ${versionNumber}, starting with 1.0.0`);
      return 'v1.0.0';
    }
    
    // Increment the patch version by default
    const nextVersion = `v${semver.inc(versionNumber, 'patch')}`;
    
    logger.info(`Generated next version ${nextVersion} for model type ${modelType}`);
    return nextVersion;
  } catch (error) {
    logger.error(`Failed to generate next version for model type ${modelType}`, { error });
    // Default to 1.0.0 if we can't determine the next version
    return 'v1.0.0';
  }
}

/**
 * Deploys a trained model to production
 *
 * @param modelType - The type of model to deploy
 * @param version - The version of the model to deploy
 * @param setAsLatest - Whether to set this version as the latest
 * @returns Promise resolving to true if deployment was successful
 */
export async function deployModel(
  modelType: string,
  version: string,
  setAsLatest: boolean = true
): Promise<boolean> {
  logger.info(`Deploying model ${modelType} version ${version}`);
  
  try {
    // Format version to ensure it starts with 'v'
    const formattedVersion = version.startsWith('v') ? version : `v${version}`;
    
    if (USE_SAGEMAKER) {
      // Create or update SageMaker endpoint
      // This would require additional implementation to create/update SageMaker endpoints
      // We'll assume it's handled by external code for now
      logger.info(`Would create/update SageMaker endpoint for ${modelType}@${formattedVersion}`);
      
      // In a real implementation, this would involve AWS SDK calls to SageMaker
      // to create or update an endpoint
    } else {
      // For local models, ensure the model exists
      const modelDir = path.join(LOCAL_MODEL_PATH, modelType, formattedVersion);
      
      if (!fs.existsSync(modelDir)) {
        throw new Error(`Model directory does not exist: ${modelDir}`);
      }
      
      // If setAsLatest is true, update the "latest" symbolic link
      if (setAsLatest) {
        const latestLinkPath = path.join(LOCAL_MODEL_PATH, modelType, 'latest');
        
        // Remove existing link if it exists
        if (fs.existsSync(latestLinkPath)) {
          await fs.remove(latestLinkPath);
        }
        
        // Create new symbolic link
        await fs.ensureSymlink(formattedVersion, latestLinkPath);
        logger.info(`Updated 'latest' link to point to ${formattedVersion}`);
      }
    }
    
    logger.info(`Model ${modelType}@${formattedVersion} deployed successfully`);
    return true;
  } catch (error) {
    logger.error(`Failed to deploy model ${modelType}@${version}`, { error });
    return false;
  }
}

/**
 * Compares the performance of two model versions
 *
 * @param modelType - The type of model to compare
 * @param version1 - First model version
 * @param version2 - Second model version
 * @param testData - Test data for comparison
 * @returns Promise resolving to comparison results
 */
export async function compareModels(
  modelType: string,
  version1: string,
  version2: string,
  testData: any
): Promise<{ better: string, metrics: Record<string, any> }> {
  logger.info(`Comparing models: ${modelType}@${version1} vs ${modelType}@${version2}`);
  
  try {
    // Use model registry to compare models
    const comparisonResult = await compareModelPerformance(
      modelType,
      version1,
      version2,
      testData
    );
    
    logger.info(`Model comparison complete`, { better: comparisonResult.better });
    return comparisonResult;
  } catch (error) {
    logger.error(`Failed to compare models ${modelType} versions ${version1} vs ${version2}`, { error });
    throw new Error(`Model comparison failed: ${(error as Error).message}`);
  }
}

/**
 * Class that provides model training and management capabilities
 */
export class ModelTrainer {
  private config: Record<string, any>;
  
  /**
   * Initializes the ModelTrainer with configuration options
   *
   * @param options - Configuration options
   */
  constructor(options: Record<string, any> = {}) {
    // Default configuration
    this.config = {
      trainingDataPath: TRAINING_DATA_PATH,
      useSageMaker: USE_SAGEMAKER,
      ...options
    };
    
    logger.info('ModelTrainer initialized', {
      useSageMaker: this.config.useSageMaker,
      trainingDataPath: this.config.trainingDataPath
    });
  }
  
  /**
   * Trains and evaluates a model for a specific model type
   *
   * @param modelType - The type of model to train
   * @param trainingData - Data for training the model
   * @param options - Additional training options
   * @returns Promise resolving to the trained model, evaluation metrics, and version
   */
  async trainAndEvaluate(
    modelType: string,
    trainingData: any,
    options: TrainingOptions = {}
  ): Promise<{ model: any, metrics: Record<string, any>, version: string }> {
    logger.info(`Training and evaluating model of type: ${modelType}`);
    
    try {
      // Prepare training data
      const preparedData = await prepareTrainingData(trainingData, modelType, options.preprocessOptions || {});
      
      // Determine input shape from the first training example
      const inputShape = [preparedData.trainData.inputs[0].length];
      
      // Create model architecture
      const model = await createModel(modelType, inputShape, options.modelParams || {});
      
      // Train the model
      const trainingConfig = {
        ...DEFAULT_TRAINING_CONFIG,
        ...options.trainingConfig,
        earlyStoppingConfig: {
          ...DEFAULT_EARLY_STOPPING_CONFIG,
          ...options.earlyStoppingConfig
        }
      };
      
      const { model: trainedModel, history } = await trainModel(
        model,
        preparedData.trainData,
        preparedData.validationData,
        trainingConfig
      );
      
      // Evaluate the model
      const metrics = await evaluateModel(trainedModel, preparedData.testData, modelType);
      
      // Generate a new version
      const version = await generateNextVersion(modelType);
      
      // Save the model
      const modelMetadata: Partial<ModelMetadata> = {
        modelType,
        version,
        metrics,
        trainingConfig: {
          ...trainingConfig,
          inputShape,
          ...options.modelParams
        },
        description: options.modelParams?.description || `${modelType} model trained on ${new Date().toISOString()}`,
        tags: options.modelParams?.tags || [modelType, 'tfjs']
      };
      
      await saveModel(trainedModel, modelType, version, modelMetadata);
      
      // Register the model with the model registry
      await registerModelWithRegistry(trainedModel, modelType, version, modelMetadata);
      
      // Deploy the model if requested
      if (options.deployAfterTraining) {
        await this.deployModel(modelType, version, options.setAsLatest);
      }
      
      logger.info(`Model ${modelType}@${version} trained and evaluated successfully`, {
        metrics: Object.entries(metrics).map(([k, v]) => `${k}: ${v}`).join(', ')
      });
      
      return { model: trainedModel, metrics, version };
    } catch (error) {
      logger.error(`Failed to train and evaluate model ${modelType}`, { error });
      throw new Error(`Model training and evaluation failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Trains a demand prediction model for forecasting load availability
   *
   * @param historicalLoadData - Historical load data for training
   * @param options - Additional training options
   * @returns Promise resolving to the trained model, evaluation metrics, and version
   */
  async trainDemandPredictionModel(
    historicalLoadData: any,
    options: TrainingOptions = {}
  ): Promise<{ model: any, metrics: Record<string, any>, version: string }> {
    logger.info('Training demand prediction model');
    
    try {
      return this.trainAndEvaluate(ModelType.DEMAND_PREDICTION, historicalLoadData, options);
    } catch (error) {
      logger.error('Failed to train demand prediction model', { error });
      throw new Error(`Demand prediction model training failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Trains a supply prediction model for forecasting truck availability
   *
   * @param historicalTruckData - Historical truck data for training
   * @param options - Additional training options
   * @returns Promise resolving to the trained model, evaluation metrics, and version
   */
  async trainSupplyPredictionModel(
    historicalTruckData: any,
    options: TrainingOptions = {}
  ): Promise<{ model: any, metrics: Record<string, any>, version: string }> {
    logger.info('Training supply prediction model');
    
    try {
      return this.trainAndEvaluate(ModelType.SUPPLY_PREDICTION, historicalTruckData, options);
    } catch (error) {
      logger.error('Failed to train supply prediction model', { error });
      throw new Error(`Supply prediction model training failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Trains a network optimization model for maximizing efficiency
   *
   * @param networkStateData - Network state data for training
   * @param options - Additional training options
   * @returns Promise resolving to the trained model, evaluation metrics, and version
   */
  async trainNetworkOptimizationModel(
    networkStateData: any,
    options: TrainingOptions = {}
  ): Promise<{ model: any, metrics: Record<string, any>, version: string }> {
    logger.info('Training network optimization model');
    
    try {
      return this.trainAndEvaluate(ModelType.NETWORK_OPTIMIZATION, networkStateData, options);
    } catch (error) {
      logger.error('Failed to train network optimization model', { error });
      throw new Error(`Network optimization model training failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Trains a driver behavior model for predicting driver preferences
   *
   * @param driverHistoryData - Driver history data for training
   * @param options - Additional training options
   * @returns Promise resolving to the trained model, evaluation metrics, and version
   */
  async trainDriverBehaviorModel(
    driverHistoryData: any,
    options: TrainingOptions = {}
  ): Promise<{ model: any, metrics: Record<string, any>, version: string }> {
    logger.info('Training driver behavior model');
    
    try {
      return this.trainAndEvaluate(ModelType.DRIVER_BEHAVIOR, driverHistoryData, options);
    } catch (error) {
      logger.error('Failed to train driver behavior model', { error });
      throw new Error(`Driver behavior model training failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Trains a price optimization model for determining optimal rates
   *
   * @param marketRateData - Market rate data for training
   * @param options - Additional training options
   * @returns Promise resolving to the trained model, evaluation metrics, and version
   */
  async trainPriceOptimizationModel(
    marketRateData: any,
    options: TrainingOptions = {}
  ): Promise<{ model: any, metrics: Record<string, any>, version: string }> {
    logger.info('Training price optimization model');
    
    try {
      return this.trainAndEvaluate(ModelType.PRICE_OPTIMIZATION, marketRateData, options);
    } catch (error) {
      logger.error('Failed to train price optimization model', { error });
      throw new Error(`Price optimization model training failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Deploys a trained model to production
   *
   * @param modelType - The type of model to deploy
   * @param version - The version of the model to deploy
   * @param setAsLatest - Whether to set this version as the latest
   * @returns Promise resolving to true if deployment was successful
   */
  async deployModel(
    modelType: string,
    version: string,
    setAsLatest: boolean = true
  ): Promise<boolean> {
    return deployModel(modelType, version, setAsLatest);
  }
  
  /**
   * Compares the performance of two model versions
   *
   * @param modelType - The type of model to compare
   * @param version1 - First model version
   * @param version2 - Second model version
   * @param testData - Test data for comparison
   * @returns Promise resolving to comparison results
   */
  async compareModels(
    modelType: string,
    version1: string,
    version2: string,
    testData: any
  ): Promise<{ better: string, metrics: Record<string, any> }> {
    return compareModels(modelType, version1, version2, testData);
  }
  
  /**
   * Loads training data from files or database
   *
   * @param modelType - The type of model to load data for
   * @param dataSource - Optional specific data source
   * @returns Promise resolving to the loaded training data
   */
  async loadTrainingData(
    modelType: string,
    dataSource?: string
  ): Promise<any> {
    logger.info(`Loading training data for model type: ${modelType}`);
    
    try {
      // Determine data source
      const source = dataSource || path.join(this.config.trainingDataPath, modelType);
      
      let data: any;
      
      if (source.startsWith('db:')) {
        // Load from database (implementation would depend on database setup)
        logger.info(`Loading training data from database: ${source.substring(3)}`);
        // This would require additional implementation
        throw new Error('Database data loading not implemented');
      } else {
        // Load from file
        const filePath = source.endsWith('.json') ? source : `${source}.json`;
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`Training data file not found: ${filePath}`);
        }
        
        data = await fs.readJSON(filePath);
        logger.info(`Loaded training data from file: ${filePath}`);
      }
      
      // Validate data structure
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error(`No training data found for ${modelType}`);
      }
      
      return data;
    } catch (error) {
      logger.error(`Failed to load training data for ${modelType}`, { error });
      throw new Error(`Data loading failed: ${(error as Error).message}`);
    }
  }
}

// Create a singleton instance for easy access
export const trainer = new ModelTrainer();