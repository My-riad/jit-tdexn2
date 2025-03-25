import { Knex } from 'knex';

/**
 * Migration function that creates the smart_hubs table for storing strategic locations
 * where drivers can exchange loads to optimize network efficiency.
 * @param knex Knex instance
 * @returns Promise that resolves when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Ensure uuid extension is available
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Create smart_hubs table
  await knex.schema.createTable('smart_hubs', (table) => {
    // Primary key
    table.uuid('hub_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic information
    table.string('name').notNullable().comment('Name of the Smart Hub');
    table.enu('hub_type', [
      'TRUCK_STOP',
      'DISTRIBUTION_CENTER',
      'REST_AREA',
      'WAREHOUSE',
      'TERMINAL',
      'YARD',
      'OTHER'
    ]).notNullable().comment('Type of facility at this Smart Hub');
    
    // Geospatial location
    table.float('latitude', 10, 6).notNullable().comment('Latitude coordinate');
    table.float('longitude', 10, 6).notNullable().comment('Longitude coordinate');
    
    // Address details
    table.string('address').notNullable().comment('Street address');
    table.string('city').notNullable().comment('City');
    table.string('state', 2).notNullable().comment('State (2-letter code)');
    table.string('zip', 10).notNullable().comment('ZIP/Postal code');
    
    // Amenities and capacity
    table.specificType('amenities', 'JSONB').notNullable().defaultTo('[]').comment('Available amenities as JSON array (PARKING, RESTROOMS, FOOD, FUEL, MAINTENANCE, SHOWER, LODGING, SECURITY, LOADING_DOCK, SCALE)');
    table.integer('capacity').unsigned().notNullable().comment('Number of trucks the hub can accommodate');
    table.specificType('operating_hours', 'JSONB').notNullable().defaultTo('{}').comment('Operating hours as JSON object');
    
    // Efficiency metrics
    table.float('efficiency_score', 4, 2).defaultTo(0).comment('Optimization score for this hub (0-100)');
    table.float('network_impact', 4, 2).defaultTo(0).comment('Measure of impact on overall network efficiency');
    
    // Status
    table.boolean('active').defaultTo(true).comment('Whether this hub is currently active');
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('Creation timestamp');
    table.timestamp('updated_at').defaultTo(knex.fn.now()).comment('Last update timestamp');
    
    // Indexes for performance
    table.index(['latitude', 'longitude'], 'idx_smart_hubs_location');
    table.index('hub_type');
    table.index('efficiency_score');
    table.index('active');
  });

  // Add trigger for automatic updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_smart_hubs_modified
    BEFORE UPDATE ON smart_hubs
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
  `);

  // Add table comment
  await knex.raw(`
    COMMENT ON TABLE smart_hubs IS 'Smart Hubs are strategically identified locations where drivers can exchange loads to optimize network efficiency. These locations are critical for implementing relay-based haul strategies and reducing empty miles.';
  `);
}

/**
 * Rollback function that drops the smart_hubs table
 * @param knex Knex instance
 * @returns Promise that resolves when rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Drop trigger first
  await knex.raw('DROP TRIGGER IF EXISTS update_smart_hubs_modified ON smart_hubs;');
  
  // Drop the table
  await knex.schema.dropTableIfExists('smart_hubs');
  
  // Note: We're not dropping the update_modified_column function as it might be used by other tables
}