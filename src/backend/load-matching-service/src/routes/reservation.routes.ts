import express from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationService } from '../services/reservation.service';
import logger from '../../../common/utils/logger';

/**
 * Sets up all reservation-related routes for the AI-driven Freight Optimization Platform.
 * This function creates a ReservationService instance, initializes a ReservationController,
 * and returns a configured Express router with all the reservation endpoints.
 * 
 * @returns Configured Express router with reservation routes
 */
function setupReservationRoutes(): express.Router {
  // Create a new ReservationService instance
  // Note: In a real implementation, the event producer would be injected or obtained
  // through a dependency injection system. For now, we create a simple stub.
  const reservationService = new ReservationService({
    produceEvent: async (event: any) => {
      logger.info('Event produced', { event });
      return true;
    }
  });
  
  // Create a new ReservationController instance with the reservation service
  const reservationController = new ReservationController(reservationService);
  
  // Get the configured router from the controller
  // The controller's setupRoutes method (called in its constructor) already
  // defines all the required routes with proper middleware
  const router = reservationController.getRouter();
  
  // Log that the reservation routes have been set up
  logger.info('Reservation routes set up successfully');
  
  return router;
}

export default setupReservationRoutes;