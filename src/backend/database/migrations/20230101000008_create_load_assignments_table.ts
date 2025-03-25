import { Knex } from 'knex'; // v2.4.2

/**
 * Migration to create the load_assignments table
 * This table tracks the relationship between loads, drivers, and vehicles,
 * managing how loads are assigned throughout the delivery process.
 * It supports both direct assignments and relay-based hauls.
 */
export async function up(knex: Knex): Promise<void> {
  // Create assignment types enum if it doesn't exist
  await knex.raw(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_type_enum') THEN
        CREATE TYPE assignment_type_enum AS ENUM ('DIRECT', 'RELAY', 'SMART_HUB_EXCHANGE');
      END IF;
    END $$;
  `);

  // Create load assignment status enum if it doesn't exist
  await knex.raw(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_assignment_status_enum') THEN
        CREATE TYPE load_assignment_status_enum AS ENUM (
          'CREATED',
          'PENDING',
          'OPTIMIZING',
          'AVAILABLE',
          'RESERVED',
          'ASSIGNED',
          'IN_TRANSIT',
          'AT_PICKUP',
          'LOADED',
          'AT_DROPOFF',
          'DELIVERED',
          'COMPLETED',
          'CANCELLED',
          'EXPIRED',
          'DELAYED',
          'EXCEPTION',
          'RESOLVED'
        );
      END IF;
    END $$;
  `);

  return knex.schema.createTable('load_assignments', (table) => {
    // Primary key
    table.uuid('assignment_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Relationship columns
    table.uuid('load_id').notNullable().references('load_id').inTable('loads').onDelete('CASCADE');
    table.uuid('driver_id').notNullable().references('driver_id').inTable('drivers').onDelete('RESTRICT');
    table.uuid('vehicle_id').notNullable().references('vehicle_id').inTable('vehicles').onDelete('RESTRICT');
    
    // Assignment metadata
    table.specificType('assignment_type', 'assignment_type_enum').notNullable();
    table.specificType('status', 'load_assignment_status_enum').notNullable().defaultTo('CREATED');
    
    // Financial data
    table.decimal('agreed_rate', 10, 2).notNullable();
    table.decimal('efficiency_score', 5, 2).nullable();
    
    // Segment location data for relay hauls
    table.jsonb('segment_start_location').nullable();
    table.jsonb('segment_end_location').nullable();
    
    // Smart hub relationship (if this is a hub-based exchange)
    table.uuid('smart_hub_id').nullable().references('hub_id').inTable('smart_hubs').onDelete('SET NULL');
    
    // Self-references for building relay chains
    table.uuid('previous_assignment_id').nullable().references('assignment_id').inTable('load_assignments').onDelete('SET NULL');
    table.uuid('next_assignment_id').nullable().references('assignment_id').inTable('load_assignments').onDelete('SET NULL');
    
    // Timing data
    table.timestamp('estimated_start_time').nullable();
    table.timestamp('estimated_end_time').nullable();
    table.timestamp('actual_start_time').nullable();
    table.timestamp('actual_end_time').nullable();
    
    // Standard timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes for frequently queried columns
    table.index('load_id');
    table.index('driver_id');
    table.index('vehicle_id');
    table.index('status');
    table.index('assignment_type');
    table.index(['previous_assignment_id', 'next_assignment_id']);
    table.index('smart_hub_id');

    // Add comment to table
    knex.raw(`
      COMMENT ON TABLE load_assignments IS 'Stores relationships between loads, drivers, and vehicles, tracking load assignments and delivery processes. Supports direct assignments and relay-based hauls where multiple drivers may handle different segments of a load journey.';
    `);
  })
  .then(() => {
    // Create trigger for automatically updating updated_at timestamp
    return knex.raw(`
      CREATE TRIGGER update_load_assignments_updated_at
      BEFORE UPDATE ON load_assignments
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `);
  });
}

/**
 * Rollback function to drop the load_assignments table
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the table
  await knex.schema.dropTableIfExists('load_assignments');
  
  // Drop the trigger
  await knex.raw(`DROP TRIGGER IF EXISTS update_load_assignments_updated_at ON load_assignments;`);
  
  // Drop the enum types
  await knex.raw(`
    DROP TYPE IF EXISTS assignment_type_enum;
    DROP TYPE IF EXISTS load_assignment_status_enum;
  `);
}