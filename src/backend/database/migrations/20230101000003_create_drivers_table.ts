import { Knex } from 'knex'; // knex version ^2.4.2

/**
 * Migration function to create the drivers table
 * This table stores information about truck drivers who are the primary users 
 * of the system that accept and deliver loads
 */
export async function up(knex: Knex): Promise<void> {
  // Check if pgcrypto extension exists, if not create it
  await knex.raw(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `);

  // Check if update_updated_at_column function exists, if not create it
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create an enum type for driver status
  await knex.raw(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status_enum') THEN
        CREATE TYPE driver_status_enum AS ENUM (
          'AVAILABLE',
          'ON_DUTY',
          'OFF_DUTY',
          'DRIVING',
          'INACTIVE',
          'SUSPENDED'
        );
      END IF;
    END $$;
  `);

  // Create an enum type for HOS status
  await knex.raw(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hos_status_enum') THEN
        CREATE TYPE hos_status_enum AS ENUM (
          'OFF_DUTY',
          'SLEEPER_BERTH',
          'DRIVING',
          'ON_DUTY_NOT_DRIVING',
          'PERSONAL_CONVEYANCE'
        );
      END IF;
    END $$;
  `);

  // Create the drivers table
  await knex.schema.createTable('drivers', (table) => {
    // Primary key
    table.uuid('driver_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign keys
    table.uuid('carrier_id').references('carrier_id').inTable('carriers').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('user_id').inTable('users').onDelete('RESTRICT');
    table.uuid('current_vehicle_id').references('vehicle_id').inTable('vehicles').onDelete('SET NULL');
    table.uuid('current_load_id').nullable(); // Will reference loads table but not enforced yet to avoid circular dependency
    
    // Personal information
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('phone').notNullable();
    
    // License information
    table.string('license_number').unique().notNullable();
    table.string('license_state', 2).notNullable();
    table.string('license_class', 5).notNullable();
    table.specificType('license_endorsements', 'varchar[]').nullable();
    table.date('license_expiration').notNullable();
    
    // Address as JSONB
    table.jsonb('home_address').notNullable();
    
    // Current location as JSONB
    table.jsonb('current_location').nullable();
    
    // Status
    table.specificType('status', 'driver_status_enum').notNullable().defaultTo('INACTIVE');
    
    // Hours of Service (HOS) data
    table.specificType('hos_status', 'hos_status_enum').nullable();
    table.timestamp('hos_status_since').nullable();
    table.integer('driving_minutes_remaining').nullable();
    table.integer('duty_minutes_remaining').nullable();
    table.integer('cycle_minutes_remaining').nullable();
    
    // Efficiency score for gamification and optimization
    table.decimal('efficiency_score', 5, 2).defaultTo(0);
    
    // ELD integration
    table.string('eld_device_id').nullable();
    table.string('eld_provider').nullable();
    
    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('active').notNullable().defaultTo(true);
    
    // Indexes for frequently queried columns
    table.index('carrier_id');
    table.index('status');
    table.index('efficiency_score');
    table.index('active');
    
    // Comment
    table.comment('Stores information about truck drivers who transport loads in the system');
  });

  // Create a trigger to automatically update the updated_at timestamp
  await knex.raw(`
    CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * Rollback function to remove the drivers table
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the table and associated trigger
  await knex.schema.dropTableIfExists('drivers');
  
  // Drop the enum types if they exist and are not used by other tables
  await knex.raw(`
    DO $$ 
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status_enum') THEN
        DROP TYPE driver_status_enum;
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hos_status_enum') THEN
        DROP TYPE hos_status_enum;
      END IF;
    END $$;
  `);
  
  // Note: We don't drop the update_updated_at_column function or pgcrypto extension
  // as they might be used by other tables
}