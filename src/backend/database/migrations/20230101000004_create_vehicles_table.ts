import { Knex } from 'knex'; // v2.4.2

export async function up(knex: Knex): Promise<void> {
  // Check if PostGIS extension is available and install it if needed
  await knex.raw(`
    CREATE EXTENSION IF NOT EXISTS postgis;
  `);

  // Create the vehicles table
  await knex.schema.createTable('vehicles', (table) => {
    table.uuid('vehicle_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('carrier_id').references('carrier_id').inTable('carriers').onDelete('CASCADE').notNullable();
    
    // Define the vehicle type enum
    table.enum('type', [
      'TRACTOR',
      'STRAIGHT_TRUCK',
      'DRY_VAN_TRAILER',
      'REFRIGERATED_TRAILER',
      'FLATBED_TRAILER',
      'TANKER_TRAILER',
      'LOWBOY_TRAILER'
    ]).notNullable();
    
    // Vehicle identification
    table.string('vin').unique().notNullable();
    table.string('make');
    table.string('model');
    table.integer('year');
    table.string('plate_number');
    table.string('plate_state', 2);
    
    // Status and relationships
    table.enum('status', [
      'ACTIVE',
      'INACTIVE',
      'AVAILABLE',
      'IN_USE',
      'MAINTENANCE',
      'OUT_OF_SERVICE'
    ]).defaultTo('ACTIVE').notNullable();
    
    table.uuid('current_driver_id').references('driver_id').inTable('drivers').onDelete('SET NULL').nullable();
    table.uuid('current_load_id').nullable();
    
    // Location and specifications
    table.jsonb('current_location').nullable(); // { latitude, longitude }
    table.float('weight_capacity').nullable(); // in pounds
    table.float('volume_capacity').nullable(); // in cubic feet
    table.jsonb('dimensions').nullable(); // { length, width, height }
    
    // Fuel and maintenance
    table.enum('fuel_type', [
      'DIESEL',
      'GASOLINE',
      'ELECTRIC',
      'HYBRID',
      'NATURAL_GAS',
      'HYDROGEN'
    ]).nullable();
    
    table.float('fuel_capacity').nullable();
    table.float('average_mpg').nullable();
    table.integer('odometer').nullable();
    table.string('eld_device_id').nullable();
    table.date('last_maintenance_date').nullable();
    table.date('next_maintenance_date').nullable();
    
    // Metadata
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.boolean('active').defaultTo(true).notNullable();
    
    // Indexes
    table.index('carrier_id');
    table.index('type');
    table.index('status');
    table.index('current_driver_id');
    table.index('active');
  });
  
  // Create a trigger for updating the updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);
  
  // Create a GIN index for the JSONB column for general JSON queries
  await knex.raw(`
    CREATE INDEX idx_vehicles_current_location_gin ON vehicles USING GIN (current_location);
  `);
  
  // Create a helper function to convert JSONB location to PostGIS geometry
  await knex.raw(`
    CREATE OR REPLACE FUNCTION vehicle_location_to_geometry(location jsonb)
    RETURNS geometry AS $$
    BEGIN
      RETURN ST_SetSRID(
        ST_MakePoint(
          (location->>'longitude')::float,
          (location->>'latitude')::float
        ), 
        4326
      );
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);
  
  // Create a functional GiST index for geospatial queries using PostGIS
  await knex.raw(`
    CREATE INDEX idx_vehicles_current_location_gist ON vehicles USING GIST (
      vehicle_location_to_geometry(current_location)
    )
    WHERE current_location IS NOT NULL;
  `);
  
  // Add table comment
  await knex.raw(`
    COMMENT ON TABLE vehicles IS 'Stores information about trucks and trailers used for transporting loads';
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop the vehicles table
  await knex.schema.dropTableIfExists('vehicles');
  
  // Drop the function and trigger if they exist
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
    DROP FUNCTION IF EXISTS vehicle_location_to_geometry(jsonb);
  `);
}