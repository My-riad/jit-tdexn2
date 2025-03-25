import { Knex } from 'knex';

/**
 * Migration to create the leaderboards table for the gamification system
 * This table stores leaderboard definitions that track driver rankings based on
 * efficiency scores and other performance metrics
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Create enum types first if not using native enum support
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leaderboard_type_enum') THEN
        CREATE TYPE leaderboard_type_enum AS ENUM ('EFFICIENCY', 'NETWORK_CONTRIBUTION', 'ON_TIME', 'HUB_UTILIZATION');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leaderboard_timeframe_enum') THEN
        CREATE TYPE leaderboard_timeframe_enum AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
      END IF;
    END
    $$;
  `);

  // Create the leaderboards table
  await knex.schema.createTable('leaderboards', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Base information
    table.string('name').notNullable();
    table.specificType('leaderboard_type', 'leaderboard_type_enum').notNullable();
    table.specificType('timeframe', 'leaderboard_timeframe_enum').notNullable();
    table.string('region').notNullable();
    
    // Period information
    table.timestamp('start_period').notNullable();
    table.timestamp('end_period').notNullable();
    
    // Bonus structure stored as JSONB to allow flexible configuration
    // Example: { "1": 500, "2": 300, "3": 200, "4-10": 100 }
    table.jsonb('bonus_structure').notNullable().defaultTo('{}');
    
    // Status
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_updated').nullable();
    
    // Standard timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Add comment to the table
    table.comment(
      'Stores leaderboard definitions for driver rankings based on performance metrics'
    );
  });

  // Create indexes for common query patterns
  await knex.schema.alterTable('leaderboards', (table) => {
    table.index('leaderboard_type');
    table.index('timeframe');
    table.index('region');
    table.index('is_active');
    table.index(['start_period', 'end_period']);
  });

  // Create trigger for automatically updating 'updated_at' column
  await knex.raw(`
    CREATE TRIGGER update_leaderboards_updated_at
    BEFORE UPDATE ON leaderboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * Rollback migration that drops the leaderboards table
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the table
  await knex.schema.dropTableIfExists('leaderboards');
  
  // Drop the enum types - only if not used by other tables
  await knex.raw(`
    DO $$
    BEGIN
      DROP TYPE IF EXISTS leaderboard_type_enum;
      DROP TYPE IF EXISTS leaderboard_timeframe_enum;
    EXCEPTION
      WHEN dependent_objects_still_exist THEN
        NULL; -- Do nothing if the type is still in use
    END
    $$;
  `);
}