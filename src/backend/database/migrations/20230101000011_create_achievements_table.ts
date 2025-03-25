import { Knex } from 'knex'; // v2.4.2

/**
 * Migration to create the achievements table for the gamification system.
 * Stores achievement definitions that drivers can earn based on performance metrics.
 */
export async function up(knex: Knex): Promise<void> {
  // Ensure uuid-ossp extension is enabled for UUID generation
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create achievement categories enum type
  await knex.raw(`
    CREATE TYPE achievement_category AS ENUM (
      'EFFICIENCY',
      'NETWORK_CONTRIBUTION',
      'ON_TIME_DELIVERY',
      'SMART_HUB_UTILIZATION',
      'FUEL_EFFICIENCY',
      'SAFETY',
      'MILESTONE'
    )
  `);

  // Create achievement levels enum type
  await knex.raw(`
    CREATE TYPE achievement_level AS ENUM (
      'BRONZE',
      'SILVER',
      'GOLD',
      'PLATINUM',
      'DIAMOND'
    )
  `);

  // Create achievements table
  await knex.schema.createTable('achievements', (table) => {
    table.uuid('achievement_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.specificType('category', 'achievement_category').notNullable();
    table.specificType('level', 'achievement_level').notNullable();
    table.integer('points').notNullable();
    table.string('badge_image_url');
    table.jsonb('criteria').notNullable().comment('JSON structure containing achievement requirements (metricType, threshold, timeframe, etc.)');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Add indexes for common query patterns
    table.index('category');
    table.index('level');
    table.index('is_active');
  });

  // Create a trigger function for updating the updated_at timestamp if it doesn't exist
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create a trigger specifically for the achievements table
  await knex.raw(`
    CREATE TRIGGER update_achievements_timestamp
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp();
  `);
}

/**
 * Rollback function to drop the achievements table and associated objects
 */
export async function down(knex: Knex): Promise<void> {
  // Drop trigger for achievements table
  await knex.raw('DROP TRIGGER IF EXISTS update_achievements_timestamp ON achievements');
  
  // Drop achievements table
  await knex.schema.dropTableIfExists('achievements');
  
  // Drop custom enum types
  await knex.raw('DROP TYPE IF EXISTS achievement_level');
  await knex.raw('DROP TYPE IF EXISTS achievement_category');
  
  // Note: We're not dropping the update_timestamp function as it might be used by other tables
}