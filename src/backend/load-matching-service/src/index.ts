import dotenv from 'dotenv'; // dotenv@^16.0.3
import express from 'express'; // express@^4.18.2
import { Kafka, Consumer } from 'kafkajs'; // kafkajs@^2.2.4

import { initializeConfig, getKafkaConfig, getKafkaTopics } from './config';
import { initializeApp } from './app';
import { DriverAvailabilityConsumer } from './consumers/driver-availability.consumer';
import { OptimizationResultsConsumer } from './consumers/optimization-results.consumer';
import { MatchEventsProducer } from './producers/match-events.producer';
import { MatchingService } from './services/matching.service';
import { RecommendationService } from './services/recommendation.service';
import { ReservationService } from './services/reservation.service';
import logger from '../../common/utils/logger';

// Load environment variables from .env file
dotenv.config();

// Define global variables
let consumers: any[]; // Array of Kafka consumers that need to be started and stopped
let server: any; // HTTP server instance

/**
 * Initializes and starts the HTTP server for the Load Matching Service
 * @returns Promise that resolves when the server is started
 */
const startServer = async (): Promise<void> => {
  try {
    // LD1: Initialize configuration using initializeConfig()
    await initializeConfig();

    // LD1: Initialize the Express application using initializeApp()
    const app = initializeApp();

    // LD1: Get the port number from environment variables or use default (3000)
    const port = process.env.PORT || 3000;

    // LD1: Start the HTTP server on the specified port
    server = app.listen(port, () => {
      // LD1: Log successful server start with port information
      logger.info(`Load Matching Service listening on port ${port}`);
    });
  } catch (error: any) {
    // LD1: Handle any errors during server startup
    logger.error('Error starting the server:', error);
    process.exit(1);
  }
};

/**
 * Sets up and starts Kafka consumers for processing events
 * @returns Promise that resolves when all consumers are started
 */
const setupKafkaConsumers = async (): Promise<void> => {
  try {
    // LD1: Get Kafka configuration using getKafkaConfig()
    const kafkaConfig = getKafkaConfig();

    // LD1: Create Kafka client and admin instances
    const kafka = new Kafka(kafkaConfig);
    const kafkaConsumer: Consumer = kafka.consumer({ groupId: 'load-matching-service-group' });

    // LD1: Initialize services (MatchingService, RecommendationService, ReservationService)
    const matchingService = new MatchingService();
    const recommendationService = new RecommendationService();

    // LD1: Create DriverAvailabilityConsumer instance
    const driverAvailabilityConsumer = new DriverAvailabilityConsumer(kafkaConsumer, matchingService);

    // LD1: Create OptimizationResultsConsumer instance
    const optimizationResultsConsumer = new OptimizationResultsConsumer(kafkaConsumer, matchingService, recommendationService);

    // LD1: Start all consumers
    consumers = [driverAvailabilityConsumer, optimizationResultsConsumer];
    await Promise.all(consumers.map(consumer => consumer.start()));

    // LD1: Log successful consumer startup
    logger.info('Kafka consumers started successfully.');
  } catch (error: any) {
    // LD1: Handle any errors during consumer setup
    logger.error('Kafka consumer setup failed.', { error: error.message });
    process.exit(1);
  }
};

/**
 * Sets up Kafka producers for publishing events
 * @returns Promise that resolves when all producers are set up
 */
const setupKafkaProducers = async (): Promise<void> => {
  try {
    // LD1: Get Kafka configuration using getKafkaConfig()
    const kafkaConfig = getKafkaConfig();

    // LD1: Create Kafka producer instance
    const kafka = new Kafka(kafkaConfig);
    const kafkaProducer = kafka.producer();

    // LD1: Initialize MatchEventsProducer with the Kafka producer
    const matchEventsProducer = new MatchEventsProducer(kafkaProducer);

    // LD1: Connect the producer to Kafka
    await kafkaProducer.connect();

    // LD1: Log successful producer setup
    logger.info('Kafka producer setup successfully.');
  } catch (error: any) {
    // LD1: Handle any errors during producer setup
    logger.error('Kafka producer setup failed.', { error: error.message });
    process.exit(1);
  }
};

/**
 * Handles graceful shutdown of the server and Kafka connections
 * @returns Promise that resolves when shutdown is complete
 */
const gracefulShutdown = async (): Promise<void> => {
  try {
    // LD1: Log shutdown initiation
    logger.info('Initiating graceful shutdown...');

    // LD1: Stop all Kafka consumers
    if (consumers && consumers.length > 0) {
      await Promise.all(consumers.map(consumer => consumer.stop()));
    }

    // LD1: Disconnect Kafka producers
    // TODO: Implement Kafka producer disconnection

    // LD1: Close the HTTP server
    if (server) {
      server.close(() => {
        // LD1: Log successful shutdown
        logger.info('Server shut down successfully.');

        // LD1: Exit the process with success code
        process.exit(0);
      });
    } else {
      logger.warn('No server instance to close.');
      process.exit(0);
    }
  } catch (error: any) {
    // LD1: Handle any errors during shutdown
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

/**
 * Main function that orchestrates the startup of the Load Matching Service
 * @returns Promise that resolves when startup is complete
 */
const main = async (): Promise<void> => {
  try {
    // LD1: Initialize configuration
    await initializeConfig();

    // LD1: Set up Kafka producers
    await setupKafkaProducers();

    // LD1: Set up Kafka consumers
    await setupKafkaConsumers();

    // LD1: Start the HTTP server
    await startServer();

    // LD1: Set up signal handlers for graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // LD1: Log successful service startup
    logger.info('Load Matching Service started successfully.');
  } catch (error: any) {
    // LD1: Handle any errors during startup
    logger.error('Load Matching Service failed to start:', error);
    process.exit(1);
  }
};

// Execute the main function
main();