/**
 * Reservation Service
 * 
 * This service manages load reservations in the AI-driven Freight Optimization Platform.
 * It handles the creation, retrieval, conversion, cancellation, and expiration of 
 * load reservations, ensuring that drivers can temporarily reserve loads before 
 * final acceptance while preventing conflicts.
 * 
 * The reservation system is a critical component of the load acceptance workflow,
 * supporting the platform's AI-driven load matching system and ensuring efficient
 * network-wide coordination.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import { ReservationModel } from '../models/reservation.model';
import { MatchModel } from '../models/match.model';
import { MatchStatus } from '../interfaces/match.interface';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { EventTypes } from '../../../common/constants/event-types';
import logger from '../../../common/utils/logger';

/**
 * Service responsible for managing load reservations in the load matching process
 */
export class ReservationService {
  private serviceName: string;
  private eventProducer: any; // Event producer for publishing events

  /**
   * Creates a new ReservationService instance
   * 
   * @param eventProducer - Event producer service for publishing events
   */
  constructor(eventProducer: any) {
    this.serviceName = 'ReservationService';
    this.eventProducer = eventProducer;
  }

  /**
   * Creates a new reservation for a match
   * 
   * @param matchId - ID of the match to reserve
   * @param driverId - ID of the driver making the reservation
   * @param loadId - ID of the load being reserved
   * @param expirationMinutes - How long the reservation should last in minutes
   * @returns Promise resolving to the created reservation
   * @throws AppError if match not found, conflicts exist, or other errors occur
   */
  async createReservation(
    matchId: string,
    driverId: string,
    loadId: string,
    expirationMinutes: number
  ): Promise<any> {
    logger.info(`${this.serviceName}: Creating reservation for match ${matchId}`, {
      driverId,
      loadId,
      expirationMinutes
    });

    // Validate that the match exists
    const match = await MatchModel.findById(matchId);
    if (!match) {
      logger.error(`${this.serviceName}: Match not found for reservation`, { matchId });
      throw new AppError(`Match ${matchId} not found`, {
        code: ErrorCodes.RES_LOAD_NOT_FOUND
      });
    }

    // Check for existing active reservations for this match
    const existingReservation = await this.getActiveReservationForMatch(matchId);
    if (existingReservation) {
      logger.error(`${this.serviceName}: Match already has an active reservation`, {
        matchId,
        existingReservation
      });
      throw new AppError(`Match ${matchId} already has an active reservation`, {
        code: ErrorCodes.CONF_STATE_CONFLICT
      });
    }

    // Check for conflicts with other active reservations
    const hasConflicts = await this.checkForConflicts(driverId, loadId);
    if (hasConflicts) {
      logger.error(`${this.serviceName}: Conflicts detected for reservation`, {
        driverId,
        loadId
      });
      throw new AppError(`Driver or load has conflicting reservations`, {
        code: ErrorCodes.CONF_STATE_CONFLICT
      });
    }

    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);

    // Create the reservation
    const reservationId = uuidv4();
    const reservation = await ReservationModel.create({
      reservation_id: reservationId,
      match_id: matchId,
      driver_id: driverId,
      load_id: loadId,
      status: 'active',
      created_at: now,
      expires_at: expiresAt
    });

    // Update match status to reserved
    await MatchModel.updateMatchStatus(matchId, MatchStatus.RESERVED, {
      reservation_expiry: expiresAt
    });

    // Publish reservation event
    await this.publishReservationEvent(
      EventTypes.LOAD_RESERVED,
      reservationId,
      {
        match_id: matchId,
        driver_id: driverId,
        load_id: loadId,
        expires_at: expiresAt
      }
    );

    logger.info(`${this.serviceName}: Reservation created successfully`, {
      reservationId,
      matchId,
      expiresAt
    });

    return reservation;
  }

  /**
   * Get the active reservation for a specific match
   * 
   * @param matchId - ID of the match to check
   * @returns Promise resolving to the active reservation or null if none exists
   */
  async getActiveReservationForMatch(matchId: string): Promise<any | null> {
    logger.debug(`${this.serviceName}: Getting active reservation for match ${matchId}`);
    return ReservationModel.getActiveReservation(matchId);
  }

  /**
   * Get all active reservations for a specific driver
   * 
   * @param driverId - ID of the driver to check
   * @returns Promise resolving to an array of active reservations
   */
  async getActiveReservationsForDriver(driverId: string): Promise<any[]> {
    logger.debug(`${this.serviceName}: Getting active reservations for driver ${driverId}`);
    const reservations = await ReservationModel.find({
      driver_id: driverId,
      status: 'active',
      expires_at: { $gt: new Date() }
    });
    return reservations;
  }

  /**
   * Get all active reservations for a specific load
   * 
   * @param loadId - ID of the load to check
   * @returns Promise resolving to an array of active reservations
   */
  async getActiveReservationsForLoad(loadId: string): Promise<any[]> {
    logger.debug(`${this.serviceName}: Getting active reservations for load ${loadId}`);
    const reservations = await ReservationModel.find({
      load_id: loadId,
      status: 'active',
      expires_at: { $gt: new Date() }
    });
    return reservations;
  }

  /**
   * Convert a reservation to an accepted match
   * 
   * @param reservationId - ID of the reservation to convert
   * @returns Promise resolving to the converted reservation
   * @throws AppError if reservation not found or not active
   */
  async convertReservation(reservationId: string): Promise<any> {
    logger.info(`${this.serviceName}: Converting reservation ${reservationId}`);

    try {
      // Update reservation status to converted
      const reservation = await ReservationModel.convertReservation(reservationId);

      // Update match status to accepted
      await MatchModel.updateMatchStatus(reservation.match_id, MatchStatus.ACCEPTED);

      // Publish event
      await this.publishReservationEvent(
        EventTypes.RESERVATION_CONVERTED,
        reservationId,
        {
          match_id: reservation.match_id,
          driver_id: reservation.driver_id,
          load_id: reservation.load_id
        }
      );

      logger.info(`${this.serviceName}: Reservation converted successfully`, {
        reservationId,
        matchId: reservation.match_id
      });

      return reservation;
    } catch (error) {
      logger.error(`${this.serviceName}: Error converting reservation`, {
        reservationId,
        error
      });
      throw new AppError(`Failed to convert reservation ${reservationId}`, {
        code: ErrorCodes.CONF_STATE_CONFLICT,
        details: { originalError: error.message }
      });
    }
  }

  /**
   * Cancel a reservation
   * 
   * @param reservationId - ID of the reservation to cancel
   * @param reason - Reason for cancellation
   * @returns Promise resolving to the cancelled reservation
   * @throws AppError if reservation not found or not active
   */
  async cancelReservation(reservationId: string, reason: string): Promise<any> {
    logger.info(`${this.serviceName}: Cancelling reservation ${reservationId}`, { reason });

    try {
      // Update reservation status to cancelled
      const reservation = await ReservationModel.cancelReservation(reservationId, reason);

      // Update match status to cancelled
      await MatchModel.updateMatchStatus(reservation.match_id, MatchStatus.CANCELLED, {
        cancellation_reason: reason
      });

      // Publish event
      await this.publishReservationEvent(
        EventTypes.RESERVATION_CANCELLED,
        reservationId,
        {
          match_id: reservation.match_id,
          driver_id: reservation.driver_id,
          load_id: reservation.load_id,
          reason: reason
        }
      );

      logger.info(`${this.serviceName}: Reservation cancelled successfully`, {
        reservationId,
        matchId: reservation.match_id
      });

      return reservation;
    } catch (error) {
      logger.error(`${this.serviceName}: Error cancelling reservation`, {
        reservationId,
        reason,
        error
      });
      throw new AppError(`Failed to cancel reservation ${reservationId}`, {
        code: ErrorCodes.CONF_STATE_CONFLICT,
        details: { originalError: error.message }
      });
    }
  }

  /**
   * Mark a reservation as expired
   * 
   * @param reservationId - ID of the reservation to expire
   * @returns Promise resolving to the expired reservation
   * @throws AppError if reservation not found or not active
   */
  async expireReservation(reservationId: string): Promise<any> {
    logger.info(`${this.serviceName}: Expiring reservation ${reservationId}`);

    try {
      // Update reservation status to expired
      const reservation = await ReservationModel.expireReservation(reservationId);

      // Update match status to expired
      await MatchModel.updateMatchStatus(reservation.match_id, MatchStatus.EXPIRED);

      // Publish event
      await this.publishReservationEvent(
        EventTypes.RESERVATION_EXPIRED,
        reservationId,
        {
          match_id: reservation.match_id,
          driver_id: reservation.driver_id,
          load_id: reservation.load_id
        }
      );

      logger.info(`${this.serviceName}: Reservation expired successfully`, {
        reservationId,
        matchId: reservation.match_id
      });

      return reservation;
    } catch (error) {
      logger.error(`${this.serviceName}: Error expiring reservation`, {
        reservationId,
        error
      });
      throw new AppError(`Failed to expire reservation ${reservationId}`, {
        code: ErrorCodes.CONF_STATE_CONFLICT,
        details: { originalError: error.message }
      });
    }
  }

  /**
   * Background job to process all expired reservations
   * 
   * @returns Promise resolving to the number of processed expirations
   */
  async processExpiredReservations(): Promise<number> {
    logger.info(`${this.serviceName}: Processing expired reservations`);

    try {
      // Find all active reservations that have expired
      const expiredReservations = await ReservationModel.find({
        status: 'active',
        expires_at: { $lte: new Date() }
      });

      logger.info(`${this.serviceName}: Found ${expiredReservations.length} expired reservations`);

      // Process each expired reservation
      let processedCount = 0;
      for (const reservation of expiredReservations) {
        try {
          await this.expireReservation(reservation.reservation_id);
          processedCount++;
        } catch (error) {
          logger.error(`${this.serviceName}: Error processing expired reservation`, {
            reservationId: reservation.reservation_id,
            error
          });
          // Continue processing other reservations despite errors
        }
      }

      logger.info(`${this.serviceName}: Processed ${processedCount} expired reservations`);
      return processedCount;
    } catch (error) {
      logger.error(`${this.serviceName}: Error in bulk processing of expired reservations`, {
        error
      });
      throw new AppError('Failed to process expired reservations', {
        code: ErrorCodes.SRV_INTERNAL_ERROR,
        details: { originalError: error.message }
      });
    }
  }

  /**
   * Check for conflicting active reservations
   * 
   * @param driverId - Driver ID to check
   * @param loadId - Load ID to check
   * @returns Promise resolving to true if conflicts exist, false otherwise
   */
  async checkForConflicts(driverId: string, loadId: string): Promise<boolean> {
    logger.debug(`${this.serviceName}: Checking for conflicts`, { driverId, loadId });
    return ReservationModel.checkForConflicts(driverId, loadId);
  }

  /**
   * Publish an event related to a reservation
   * 
   * @param eventType - Type of event to publish
   * @param reservationId - ID of the reservation
   * @param eventData - Additional event data
   * @returns Promise resolving when the event is published
   */
  private async publishReservationEvent(
    eventType: string,
    reservationId: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      const eventMetadata = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        service: this.serviceName
      };

      const eventPayload = {
        reservation_id: reservationId,
        ...eventData
      };

      const event = {
        metadata: eventMetadata,
        payload: eventPayload
      };

      await this.eventProducer.produceEvent(event);
      logger.debug(`${this.serviceName}: Published event ${eventType}`, { reservationId });
    } catch (error) {
      // Log the error but don't fail the operation due to event publishing issues
      logger.error(`${this.serviceName}: Failed to publish event ${eventType}`, {
        reservationId,
        error
      });
    }
  }
}