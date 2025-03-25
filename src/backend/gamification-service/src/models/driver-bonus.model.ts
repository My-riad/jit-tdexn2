import { Model } from 'objection'; // v3.0.1
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import BonusZoneModel from './bonus-zone.model';

/**
 * Objection.js model class for tracking financial bonuses awarded to drivers
 * for activities in bonus zones, such as hauling loads to specific geographic areas
 * with high demand.
 */
class DriverBonusModel extends Model {
  // Properties
  id!: string;
  driverId!: string;
  zoneId!: string;
  assignmentId?: string;
  bonusAmount!: number;
  bonusReason!: string;
  paid!: boolean;
  earnedAt!: Date;
  paidAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  /**
   * Returns the database table name for this model
   */
  static get tableName() {
    return 'driver_bonuses';
  }

  /**
   * Defines the JSON schema for validation of driver bonus objects
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['driverId', 'zoneId', 'bonusAmount', 'bonusReason'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        driverId: { type: 'string', format: 'uuid' },
        zoneId: { type: 'string', format: 'uuid' },
        assignmentId: { type: ['string', 'null'], format: 'uuid' },
        bonusAmount: { type: 'number', minimum: 0 },
        bonusReason: { type: 'string' },
        paid: { type: 'boolean', default: false },
        earnedAt: { type: 'string', format: 'date-time' },
        paidAt: { type: ['string', 'null'], format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  /**
   * Defines relationships to other models
   */
  static get relationMappings() {
    return {
      // Relationship to the BonusZoneModel
      zone: {
        relation: Model.BelongsToOneRelation,
        modelClass: BonusZoneModel,
        join: {
          from: 'driver_bonuses.zoneId',
          to: 'bonus_zones.id'
        }
      },
      
      // Relationship to the Driver model
      driver: {
        relation: Model.BelongsToOneRelation,
        modelClass: () => require('../driver/driver.model').default,
        join: {
          from: 'driver_bonuses.driverId',
          to: 'drivers.id'
        }
      },
      
      // Relationship to the LoadAssignment model
      assignment: {
        relation: Model.BelongsToOneRelation,
        modelClass: () => require('../load-assignment/load-assignment.model').default,
        join: {
          from: 'driver_bonuses.assignmentId',
          to: 'load_assignments.id'
        }
      }
    };
  }

  /**
   * Lifecycle hook that runs before inserting a new driver bonus record
   */
  $beforeInsert() {
    this.id = this.id || uuidv4();
    this.paid = this.paid !== undefined ? this.paid : false;
    this.earnedAt = this.earnedAt || new Date();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Lifecycle hook that runs before updating a driver bonus record
   */
  $beforeUpdate() {
    this.updatedAt = new Date();
  }

  /**
   * Marks the bonus as paid and records the payment timestamp
   * 
   * @returns Promise resolving to the updated bonus model
   */
  async markAsPaid(): Promise<DriverBonusModel> {
    // If already paid, return the current instance without changes
    if (this.paid) {
      return this;
    }
    
    // Mark as paid and set payment timestamp
    this.paid = true;
    this.paidAt = new Date();
    
    // Save the updated record to the database
    return await this.$query().patchAndFetch({
      paid: this.paid,
      paidAt: this.paidAt,
      updatedAt: this.updatedAt
    });
  }

  /**
   * Retrieves all unpaid bonuses for a specific driver
   * 
   * @param driverId - The ID of the driver
   * @returns Promise resolving to an array of unpaid bonus records
   */
  static async getUnpaidBonusesForDriver(driverId: string): Promise<DriverBonusModel[]> {
    return DriverBonusModel.query()
      .where('driverId', driverId)
      .where('paid', false)
      .orderBy('earnedAt');
  }

  /**
   * Calculates the total amount of unpaid bonuses for a driver
   * 
   * @param driverId - The ID of the driver
   * @returns Promise resolving to the total unpaid amount
   */
  static async getTotalUnpaidAmount(driverId: string): Promise<number> {
    const unpaidBonuses = await DriverBonusModel.getUnpaidBonusesForDriver(driverId);
    return unpaidBonuses.reduce((total, bonus) => total + bonus.bonusAmount, 0);
  }

  /**
   * Retrieves all bonuses awarded for a specific bonus zone
   * 
   * @param zoneId - The ID of the bonus zone
   * @returns Promise resolving to an array of bonus records for the zone
   */
  static async getBonusesForZone(zoneId: string): Promise<DriverBonusModel[]> {
    return DriverBonusModel.query()
      .where('zoneId', zoneId)
      .orderBy('earnedAt');
  }

  /**
   * Retrieves all bonuses awarded for a specific load assignment
   * 
   * @param assignmentId - The ID of the load assignment
   * @returns Promise resolving to an array of bonus records for the assignment
   */
  static async getBonusesForAssignment(assignmentId: string): Promise<DriverBonusModel[]> {
    return DriverBonusModel.query()
      .where('assignmentId', assignmentId)
      .orderBy('earnedAt');
  }
}

// Export the model as the default export
export default DriverBonusModel;

// Named exports for helper functions that wrap the model methods
export function markAsPaid(bonus: DriverBonusModel): Promise<DriverBonusModel> {
  return bonus.markAsPaid();
}

export function getUnpaidBonusesForDriver(driverId: string): Promise<DriverBonusModel[]> {
  return DriverBonusModel.getUnpaidBonusesForDriver(driverId);
}

export function getTotalUnpaidAmount(driverId: string): Promise<number> {
  return DriverBonusModel.getTotalUnpaidAmount(driverId);
}

export function getBonusesForZone(zoneId: string): Promise<DriverBonusModel[]> {
  return DriverBonusModel.getBonusesForZone(zoneId);
}

export function getBonusesForAssignment(assignmentId: string): Promise<DriverBonusModel[]> {
  return DriverBonusModel.getBonusesForAssignment(assignmentId);
}