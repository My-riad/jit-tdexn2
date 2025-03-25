import { Knex } from 'knex'; // knex ^2.4.2

/**
 * Migration function that creates the driver_hos table to store Hours of Service (HOS) 
 * records for truck drivers. This data is critical for regulatory compliance with 
 * FMCSA requirements and for determining driver availability for load assignments.
 */
export async function up(knex: Knex): Promise<void> {
  // Ensure UUID extension is available
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create the driver_hos table
  await knex.schema.createTable('driver_hos', (table) => {
    // Primary key
    table.uuid('hos_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign key to drivers table
    table.uuid('driver_id')
      .notNullable()
      .references('driver_id')
      .inTable('drivers')
      .onDelete('CASCADE')
      .index();
    
    // HOS status
    table.enum('status', [
      'DRIVING',
      'ON_DUTY_NOT_DRIVING',
      'OFF_DUTY',
      'SLEEPER_BERTH',
      'PERSONAL_CONVEYANCE'
    ]).notNullable().index();
    
    // When the status was set
    table.timestamp('status_since').notNullable();
    
    // Remaining time
    table.integer('driving_minutes_remaining').notNullable();
    table.integer('duty_minutes_remaining').notNullable();
    table.integer('cycle_minutes_remaining').notNullable();
    
    // Location data
    table.jsonb('location').nullable().comment('JSON containing latitude and longitude');
    
    // Vehicle association
    table.uuid('vehicle_id')
      .nullable()
      .references('vehicle_id')
      .inTable('vehicles')
      .onDelete('SET NULL');
    
    // ELD data
    table.string('eld_log_id').nullable().comment('Reference ID from the external ELD system');
    table.string('eld_source').nullable().comment('ELD provider name (e.g., KeepTruckin, Omnitracs)');
    
    // Timestamps
    table.timestamp('recorded_at').notNullable().index();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Create composite index for efficient history queries
    table.index(['driver_id', 'recorded_at']);
    
    // Prevent duplicate records
    table.unique(['driver_id', 'recorded_at', 'eld_log_id'], 'uk_driver_hos_record');
  });
  
  // Add table comments
  await knex.raw(`
    COMMENT ON TABLE driver_hos IS 'Stores Hours of Service (HOS) records for drivers, required for FMCSA compliance and load eligibility determination. Data must be retained for at least 6 months.';
  `);
  
  // Ensure the update_updated_at_column function exists
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Create trigger for updated_at
  await knex.raw(`
    CREATE TRIGGER update_driver_hos_updated_at
    BEFORE UPDATE ON driver_hos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);
}

/**
 * Rollback function that removes the driver_hos table
 */
export async function down(knex: Knex): Promise<void> {
  // Drop trigger first
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_driver_hos_updated_at ON driver_hos;
  `);
  
  // Drop table
  await knex.schema.dropTableIfExists('driver_hos');
  
  // Note: We don't drop the function update_updated_at_column as it might be used by other tables
  // Note: We don't drop the uuid-ossp extension as it might be used by other tables
}