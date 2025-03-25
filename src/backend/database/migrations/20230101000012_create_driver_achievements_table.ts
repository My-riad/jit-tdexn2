import { Knex } from 'knex';

/**
 * Migration to create the driver_achievements table.
 * This table establishes the many-to-many relationship between drivers and achievements,
 * tracking which achievements have been earned by which drivers, when they were earned,
 * and storing any achievement-specific data.
 * 
 * This implements the Gamification & Incentive Engine features (F-004, F-005) that
 * allow drivers to earn achievements and rewards based on their performance.
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Create the driver_achievements table
  await knex.schema.createTable('driver_achievements', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign keys
    table.uuid('driver_id').notNullable()
      .references('id').inTable('drivers')
      .onDelete('CASCADE')
      .index();
      
    table.uuid('achievement_id').notNullable()
      .references('id').inTable('achievements')
      .onDelete('CASCADE')
      .index();
    
    // Achievement data
    table.timestamp('earned_at').notNullable().defaultTo(knex.fn.now()).index();
    table.jsonb('achievement_data').defaultTo('{}');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Constraints
    table.unique(['driver_id', 'achievement_id']);
  });
  
  // Add table comment
  await knex.raw(`
    COMMENT ON TABLE driver_achievements IS 'Tracks achievements earned by drivers, including when they were earned and any achievement-specific data for gamification features';
  `);
  
  // Create trigger for automatic updated_at timestamp
  await knex.raw(`
    CREATE TRIGGER update_driver_achievements_updated_at
    BEFORE UPDATE ON driver_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * Rollback migration by dropping the driver_achievements table.
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the trigger if it exists
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_driver_achievements_updated_at ON driver_achievements;
  `);
  
  // Drop the table if it exists
  await knex.schema.dropTableIfExists('driver_achievements');
}