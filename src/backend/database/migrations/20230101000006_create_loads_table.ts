import * as Knex from 'knex'; // knex ^2.4.2

export async function up(knex: Knex): Promise<void> {
  // Create extension for UUID generation if it doesn't exist
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  
  // Create load status enum
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_status') THEN
        CREATE TYPE load_status AS ENUM (
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
    END
    $$;
  `);

  // Create equipment type enum
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_type') THEN
        CREATE TYPE equipment_type AS ENUM (
          'DRY_VAN', 
          'REFRIGERATED', 
          'FLATBED'
        );
      END IF;
    END
    $$;
  `);

  // Create loads table
  await knex.schema.createTable('loads', (table) => {
    table.uuid('load_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('shipper_id').notNullable();
    table.string('reference_number').unique().notNullable();
    table.text('description');
    table.specificType('equipment_type', 'equipment_type').notNullable();
    table.float('weight').notNullable(); // Weight in pounds
    table.jsonb('dimensions').notNullable(); // {length, width, height} in feet
    table.float('volume'); // Volume in cubic feet
    table.integer('pallets'); // Number of pallets
    table.string('commodity'); // Description of load contents
    table.specificType('status', 'load_status').notNullable().defaultTo('CREATED');
    table.timestamp('pickup_earliest').notNullable();
    table.timestamp('pickup_latest').notNullable();
    table.timestamp('delivery_earliest').notNullable();
    table.timestamp('delivery_latest').notNullable();
    table.decimal('offered_rate', 10, 2); // Rate offered in dollars
    table.text('special_instructions');
    table.boolean('is_hazardous').defaultTo(false);
    table.jsonb('temperature_requirements'); // For refrigerated loads
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Create indexes for faster queries
    table.index('shipper_id');
    table.index('status');
    table.index('equipment_type');
    table.index('pickup_earliest');
    table.index('delivery_earliest');
    
    // Foreign key constraint
    table.foreign('shipper_id').references('shipper_id').inTable('shippers').onDelete('CASCADE');
  });

  // Create function and trigger for automatically updating updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_loads_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_loads_updated_at_trigger
    BEFORE UPDATE ON loads
    FOR EACH ROW
    EXECUTE PROCEDURE update_loads_updated_at();
  `);

  // Add table comment
  await knex.raw(`
    COMMENT ON TABLE loads IS 'Stores information about freight loads that need to be transported in the AI-driven Freight Optimization Platform';
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger and function first
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_loads_updated_at_trigger ON loads;
    DROP FUNCTION IF EXISTS update_loads_updated_at();
  `);
  
  // Drop the loads table
  await knex.schema.dropTableIfExists('loads');
  
  // We don't drop the ENUMs since they might be used by other tables
}