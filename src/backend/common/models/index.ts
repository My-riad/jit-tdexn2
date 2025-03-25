/**
 * Common Models Index
 * 
 * This file serves as the central export point for all common model definitions
 * used throughout the AI-driven Freight Optimization Platform. By aggregating models
 * in one location, we enable consistent data structures across microservices.
 * 
 * @version 1.0.0
 */

// Driver-related models
export * from './driver/driver.model';
export * from './driver/driver-location.model';
export * from './driver/driver-preference.model';
export * from './driver/driver-qualification.model';
export * from './driver/driver-hos.model';
export * from './driver/driver-score.model';
export * from './driver/driver-achievement.model';

// Load-related models
export * from './load/load.model';
export * from './load/load-location.model';
export * from './load/load-requirement.model';
export * from './load/load-document.model';
export * from './load/load-status.model';

// Carrier-related models
export * from './carrier/carrier.model';
export * from './carrier/carrier-profile.model';

// Vehicle-related models
export * from './vehicle/vehicle.model';
export * from './vehicle/vehicle-type.model';

// Assignment-related models
export * from './assignment/load-assignment.model';
export * from './assignment/assignment-status.model';
export * from './assignment/assignment-event.model';

// Shipper-related models
export * from './shipper/shipper.model';
export * from './shipper/shipper-profile.model';

// Smart Hub-related models
export * from './smart-hub/smart-hub.model';
export * from './smart-hub/hub-facility.model';

// Gamification-related models
export * from './gamification/leaderboard.model';
export * from './gamification/leaderboard-entry.model';
export * from './gamification/achievement.model';
export * from './gamification/bonus-zone.model';
export * from './gamification/driver-bonus.model';

// User-related models
export * from './user/user.model';
export * from './user/role.model';
export * from './user/permission.model';

// GeoSpatial models
export * from './geo/geographic-zone.model';
export * from './geo/location.model';
export * from './geo/coordinates.model';

// Common interfaces, types, and enums
export * from './common/base-entity.model';
export * from './common/address.model';
export * from './common/contact-info.model';
export * from './common/status.enum';
export * from './common/equipment-type.enum';
export * from './common/dimension.model';

// Event-related models
export * from './event/event-base.model';
export * from './event/position-update-event.model';
export * from './event/load-status-event.model';