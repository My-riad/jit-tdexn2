import { Knex } from 'knex'; // v2.4.2

/**
 * Migration to create the load_locations table for storing pickup, delivery,
 * and intermediate stop locations associated with loads in the AI-driven Freight Optimization Platform.
 * 
 * This table tracks all location details including address information, coordinates, 
 * time windows, and contact information for the freight optimization system.
 */
export function up(knex: Knex): Promise<void> {
  return knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    .then(() => {
      return knex.schema.createTable('load_locations', (table) => {
        // Primary key
        table.uuid('location_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        
        // References to parent load
        table.uuid('load_id').notNullable()
          .references('load_id')
          .inTable('loads')
          .onDelete('CASCADE');
        
        // Location type: PICKUP, DELIVERY, or STOP
        table.string('location_type', 20).notNullable();
        
        // Facility information
        table.string('facility_name', 255);
        table.string('address', 255).notNullable();
        table.string('city', 100).notNullable();
        table.string('state', 50).notNullable();
        table.string('zip', 20).notNullable();
        
        // Geolocation coordinates
        table.decimal('latitude', 10, 6);
        table.decimal('longitude', 10, 6);
        
        // Appointment time window
        table.timestamp('earliest_time');
        table.timestamp('latest_time');
        
        // Contact information
        table.string('contact_name', 100);
        table.string('contact_phone', 50);
        
        // Special handling instructions
        table.text('special_instructions');
        
        // Timestamps for record management
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
        
        // Add indexes for performance
        table.index('load_id');
        table.index('location_type');
        table.index(['latitude', 'longitude']);
      });
    })
    .then(() => {
      // Add check constraint for location_type
      return knex.raw(`
        ALTER TABLE load_locations
        ADD CONSTRAINT check_location_type
        CHECK (location_type IN ('PICKUP', 'DELIVERY', 'STOP'));
      `);
    })
    .then(() => {
      // Create GiST index for geospatial queries
      return knex.raw(`
        CREATE INDEX idx_load_locations_gist ON load_locations 
        USING GIST (point(longitude, latitude));
      `);
    })
    .then(() => {
      // Create trigger for automatically updating updated_at timestamp
      return knex.raw(`
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_load_locations_timestamp
        BEFORE UPDATE ON load_locations
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
      `);
    })
    .then(() => {
      // Add table comment
      return knex.raw(`
        COMMENT ON TABLE load_locations IS 'Stores pickup, delivery, and intermediate stop locations associated with loads';
      `);
    });
}

/**
 * Rollback function to drop the load_locations table
 */
export function down(knex: Knex): Promise<void> {
  return knex.raw(`
    DROP TRIGGER IF EXISTS update_load_locations_timestamp ON load_locations;
    DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
  `)
    .then(() => {
      return knex.schema.dropTableIfExists('load_locations');
    });
}