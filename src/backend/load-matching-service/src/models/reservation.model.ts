import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import mongoose from 'mongoose'; // mongoose v7.0.0

/**
 * Interface for Match Reservation Document
 * Extends Mongoose Document for type-safety
 */
export interface MatchReservationDocument extends mongoose.Document {
  reservation_id: string;
  match_id: string;
  driver_id: string;
  load_id: string;
  status: 'active' | 'expired' | 'converted' | 'cancelled';
  created_at: Date;
  expires_at: Date;
  metadata: Record<string, any>;
}

/**
 * Interface for Match Reservation Model
 * Extends Mongoose Model with custom static methods
 */
interface MatchReservationModel extends mongoose.Model<MatchReservationDocument> {
  getActiveReservation(matchId: string): Promise<MatchReservationDocument | null>;
  expireReservation(reservationId: string): Promise<MatchReservationDocument>;
  convertReservation(reservationId: string): Promise<MatchReservationDocument>;
  cancelReservation(reservationId: string, reason: string): Promise<MatchReservationDocument>;
  checkForConflicts(driverId: string, loadId: string): Promise<boolean>;
}

/**
 * Mongoose Schema for Match Reservations
 * Represents temporary load reservations by drivers during the load acceptance process
 */
export const ReservationSchema = new mongoose.Schema({
  reservation_id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  match_id: {
    type: String,
    required: true,
    index: true
  },
  driver_id: {
    type: String,
    required: true,
    index: true
  },
  load_id: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'converted', 'cancelled'],
    default: 'active',
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true,
    index: true
  },
  metadata: {
    type: Object,
    default: {}
  }
});

// Add compound indexes for query optimization
ReservationSchema.index({ match_id: 1 }, { background: true });
ReservationSchema.index({ driver_id: 1, status: 1 }, { background: true });
ReservationSchema.index({ load_id: 1, status: 1 }, { background: true });
ReservationSchema.index({ status: 1, expires_at: 1 }, { background: true });

/**
 * Get the active reservation for a specific match
 * @param matchId The match ID to query
 * @returns Promise resolving to the active reservation or null if none exists
 */
ReservationSchema.statics.getActiveReservation = async function(matchId: string): Promise<MatchReservationDocument | null> {
  return this.findOne({
    match_id: matchId,
    status: 'active',
    expires_at: { $gt: new Date() }
  });
};

/**
 * Mark a reservation as expired
 * @param reservationId The ID of the reservation to expire
 * @returns Promise resolving to the expired reservation
 * @throws Error if reservation not found or not active
 */
ReservationSchema.statics.expireReservation = async function(reservationId: string): Promise<MatchReservationDocument> {
  const reservation = await this.findOneAndUpdate(
    { reservation_id: reservationId, status: 'active' },
    { status: 'expired' },
    { new: true }
  );
  
  if (!reservation) {
    throw new Error(`Reservation ${reservationId} not found or not active`);
  }
  
  return reservation;
};

/**
 * Convert a reservation to an accepted match
 * @param reservationId The ID of the reservation to convert
 * @returns Promise resolving to the converted reservation
 * @throws Error if reservation not found or not active
 */
ReservationSchema.statics.convertReservation = async function(reservationId: string): Promise<MatchReservationDocument> {
  const reservation = await this.findOneAndUpdate(
    { reservation_id: reservationId, status: 'active' },
    { status: 'converted' },
    { new: true }
  );
  
  if (!reservation) {
    throw new Error(`Reservation ${reservationId} not found or not active`);
  }
  
  return reservation;
};

/**
 * Cancel a reservation
 * @param reservationId The ID of the reservation to cancel
 * @param reason The reason for cancellation
 * @returns Promise resolving to the cancelled reservation
 * @throws Error if reservation not found or not active
 */
ReservationSchema.statics.cancelReservation = async function(reservationId: string, reason: string): Promise<MatchReservationDocument> {
  const updatedData = {
    status: 'cancelled',
    'metadata.cancellation_reason': reason,
    'metadata.cancelled_at': new Date()
  };

  const reservation = await this.findOneAndUpdate(
    { reservation_id: reservationId, status: 'active' },
    updatedData,
    { new: true }
  );
  
  if (!reservation) {
    throw new Error(`Reservation ${reservationId} not found or not active`);
  }
  
  return reservation;
};

/**
 * Check for conflicting active reservations
 * @param driverId The driver ID to check
 * @param loadId The load ID to check
 * @returns Promise resolving to true if conflicts exist, false otherwise
 */
ReservationSchema.statics.checkForConflicts = async function(driverId: string, loadId: string): Promise<boolean> {
  // Check for conflicts:
  // 1. Driver has another active reservation
  // 2. Load is already reserved by another driver
  const conflicts = await this.findOne({
    $or: [
      // Driver has active reservations for other loads
      { 
        driver_id: driverId, 
        load_id: { $ne: loadId }, 
        status: 'active', 
        expires_at: { $gt: new Date() } 
      },
      // Load is reserved by other drivers
      { 
        load_id: loadId, 
        driver_id: { $ne: driverId }, 
        status: 'active', 
        expires_at: { $gt: new Date() } 
      }
    ]
  }).lean();
  
  return !!conflicts;
};

// Create and export the Reservation model
export const ReservationModel = mongoose.model<MatchReservationDocument, MatchReservationModel>(
  'MatchReservation',
  ReservationSchema
);