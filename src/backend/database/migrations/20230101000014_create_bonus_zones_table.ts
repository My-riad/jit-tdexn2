import type { Knex } from 'knex';

/**
 * Migration to create the bonus_zones table for the gamification system.
 * This table stores geographic areas where drivers receive temporary financial incentives
 * to address supply/demand imbalances, supporting the Dynamic Bonus Zones feature.
 */
export async function up(knex: Knex): Promise<void> {
  // Enable required extensions if not already enabled
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create bonus_zones table
  await knex.schema.createTable('bonus_zones', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    // Note: geometry column will be added with raw SQL below
    table.decimal('multiplier', 5, 2).notNullable();
    table.text('reason').notNullable();
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('is_active');
    table.index(['start_time', 'end_time']);
  });

  // Add geometry column for the boundary
  await knex.raw(`
    ALTER TABLE bonus_zones 
    ADD COLUMN boundary GEOMETRY(POLYGON, 4326) NOT NULL;
  `);

  // Create spatial index
  await knex.raw(`
    CREATE INDEX bonus_zones_boundary_idx 
    ON bonus_zones 
    USING GIST (boundary);
  `);

  // Constraint to ensure multiplier is at least 1.0
  await knex.raw(`
    ALTER TABLE bonus_zones 
    ADD CONSTRAINT bonus_zones_multiplier_min 
    CHECK (multiplier >= 1.0);
  `);

  // Create trigger function for automatic update of updated_at if it doesn't exist
  await knex.raw(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger for automatic update of updated_at
  await knex.raw(`
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON bonus_zones
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  `);
}

/**
 * Rollback migration to drop the bonus_zones table.
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the bonus_zones table and all associated objects
  await knex.schema.dropTableIfExists('bonus_zones');
  
  // Note: We don't drop the trigger_set_timestamp function or extensions
  // as they might be used by other tables
}