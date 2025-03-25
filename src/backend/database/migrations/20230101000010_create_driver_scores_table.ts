import { Knex } from 'knex';

/**
 * Migration function that creates the driver_scores table for storing efficiency scores
 * in the AI-driven Freight Optimization Platform.
 * 
 * This table stores comprehensive scoring data used for the gamification system,
 * including overall driver efficiency scores and individual component scores for:
 * - Empty miles reduction (30% weight)
 * - Network contribution (25% weight)
 * - On-time performance (20% weight)
 * - Smart Hub utilization (15% weight)
 * - Fuel efficiency (10% weight)
 * 
 * These scores are used for leaderboards, driver rewards, and optimization algorithms.
 */
export async function up(knex: Knex): Promise<void> {
  // Ensure uuid-ossp extension is enabled for UUID generation
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create the driver_scores table
  await knex.schema.createTable('driver_scores', (table) => {
    // Primary key - unique identifier for each score record
    table.uuid('score_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign key to drivers table - which driver this score belongs to
    table.uuid('driver_id').notNullable()
      .references('driver_id').inTable('drivers')
      .onDelete('CASCADE');
    
    // Overall efficiency score (0-100) - weighted combination of component scores
    table.decimal('total_score', 5, 2).notNullable();
    
    // Individual score components (each 0-100)
    
    // Empty miles reduction score - 30% weight in total score
    // Measures how effectively the driver reduces deadhead miles
    table.decimal('empty_miles_score', 5, 2).notNullable();
    
    // Network contribution score - 25% weight in total score
    // Measures how driver's decisions benefit the overall network
    table.decimal('network_contribution_score', 5, 2).notNullable();
    
    // On-time performance score - 20% weight in total score
    // Measures adherence to pickup and delivery schedules
    table.decimal('on_time_score', 5, 2).notNullable();
    
    // Smart Hub utilization score - 15% weight in total score
    // Measures driver participation in load exchanges at Smart Hubs
    table.decimal('hub_utilization_score', 5, 2).notNullable();
    
    // Fuel efficiency score - 10% weight in total score
    // Measures fuel consumption relative to route and load type
    table.decimal('fuel_efficiency_score', 5, 2).notNullable();
    
    // Additional calculation details as JSON
    // Stores detailed breakdown of how scores were calculated
    table.jsonb('score_factors').defaultTo('{}');
    
    // When was the score calculated - used for time-based analysis
    table.timestamp('calculated_at').notNullable().defaultTo(knex.fn.now());
    
    // Standard timestamps for record keeping
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Add check constraints to ensure scores are within valid range (0-100)
  await knex.schema.raw(`
    -- Ensure total score is between 0 and 100
    ALTER TABLE driver_scores ADD CONSTRAINT chk_total_score 
      CHECK (total_score >= 0 AND total_score <= 100);
    
    -- Ensure empty miles score is between 0 and 100
    ALTER TABLE driver_scores ADD CONSTRAINT chk_empty_miles_score 
      CHECK (empty_miles_score >= 0 AND empty_miles_score <= 100);
    
    -- Ensure network contribution score is between 0 and 100
    ALTER TABLE driver_scores ADD CONSTRAINT chk_network_contribution_score 
      CHECK (network_contribution_score >= 0 AND network_contribution_score <= 100);
    
    -- Ensure on-time score is between 0 and 100
    ALTER TABLE driver_scores ADD CONSTRAINT chk_on_time_score 
      CHECK (on_time_score >= 0 AND on_time_score <= 100);
    
    -- Ensure hub utilization score is between 0 and 100
    ALTER TABLE driver_scores ADD CONSTRAINT chk_hub_utilization_score 
      CHECK (hub_utilization_score >= 0 AND hub_utilization_score <= 100);
    
    -- Ensure fuel efficiency score is between 0 and 100
    ALTER TABLE driver_scores ADD CONSTRAINT chk_fuel_efficiency_score 
      CHECK (fuel_efficiency_score >= 0 AND fuel_efficiency_score <= 100);
  `);

  // Add table comment to document purpose
  await knex.schema.raw(`
    COMMENT ON TABLE driver_scores IS 'Stores driver efficiency scores used for gamification, leaderboards, and rewards in the freight optimization platform';
  `);

  // Create indexes for frequently queried columns
  await knex.schema.raw(`
    -- Index for looking up scores by driver
    CREATE INDEX idx_driver_scores_driver_id ON driver_scores (driver_id);
    
    -- Index for sorting by total score (descending for leaderboards)
    CREATE INDEX idx_driver_scores_total_score ON driver_scores (total_score DESC);
    
    -- Index for finding scores by calculation date
    CREATE INDEX idx_driver_scores_calculated_at ON driver_scores (calculated_at DESC);
  `);

  // Create trigger to automatically update the updated_at timestamp
  // Assumes update_timestamp() function exists from a previous migration
  await knex.schema.raw(`
    CREATE TRIGGER update_driver_scores_updated_at
    BEFORE UPDATE ON driver_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  `);
}

/**
 * Rollback function that removes the driver_scores table
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the table and all associated objects (constraints, indexes, triggers)
  await knex.schema.dropTableIfExists('driver_scores');
}