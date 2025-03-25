import { Knex } from 'knex'; // v2.4.2

/**
 * Migration to create the market_rates table.
 * 
 * This table stores current and historical freight rate information for specific lanes
 * (origin-destination pairs) and equipment types, enabling the Market Intelligence Service
 * to provide dynamic pricing, rate forecasting, and market trend analysis.
 */
export async function up(knex: Knex): Promise<void> {
  // Ensure UUID extension is available (PostgreSQL specific)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }

  await knex.schema.createTable('market_rates', (table) => {
    // Primary key with database-specific default UUID generation
    if (knex.client.config.client === 'postgresql') {
      table.uuid('rate_id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'))
        .comment('Unique identifier for the market rate entry');
    } else {
      table.uuid('rate_id').primary().notNullable()
        .comment('Unique identifier for the market rate entry');
    }
    
    // Lane information
    table.string('origin_region', 255).notNullable().index()
      .comment('Origin region for the freight lane');
    table.string('destination_region', 255).notNullable().index()
      .comment('Destination region for the freight lane');
    table.string('equipment_type', 50).notNullable().index()
      .comment('Type of equipment required (dry_van, refrigerated, flatbed, etc.)');
    
    // Rate information
    table.decimal('average_rate', 10, 2).notNullable()
      .comment('Average rate for the lane and equipment type in USD');
    table.decimal('min_rate', 10, 2).notNullable()
      .comment('Minimum observed rate for the lane and equipment type in USD');
    table.decimal('max_rate', 10, 2).notNullable()
      .comment('Maximum observed rate for the lane and equipment type in USD');
    table.integer('sample_size').notNullable().defaultTo(1)
      .comment('Number of data points used to calculate the rate statistics');
    
    // Timestamp
    table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now())
      .comment('Timestamp when this rate information was recorded');
    
    // Composite index for efficient querying of lane + equipment + time
    table.index(
      ['origin_region', 'destination_region', 'equipment_type', 'recorded_at'], 
      'idx_market_rates_lane_time'
    );
    
    // Additional index for time-series queries
    table.index('recorded_at', 'idx_market_rates_time');
  });

  // Add check constraints (database-specific)
  const isCompatibleDB = ['postgresql', 'mysql', 'mysql2'].includes(knex.client.config.client as string);
  
  if (isCompatibleDB) {
    // Map of constraint names to their conditions
    const constraints = {
      chk_equipment_type: "equipment_type IN ('dry_van', 'refrigerated', 'flatbed', 'specialized', 'tanker', 'other')",
      chk_min_rate: "min_rate >= 0",
      chk_avg_rate: "average_rate >= 0",
      chk_max_rate: "max_rate >= 0",
      chk_rate_order: "min_rate <= average_rate AND average_rate <= max_rate",
      chk_sample_size: "sample_size >= 1"
    };
    
    // Add each constraint
    for (const [name, condition] of Object.entries(constraints)) {
      await knex.raw(`ALTER TABLE market_rates ADD CONSTRAINT ${name} CHECK (${condition})`);
    }
  }
}

/**
 * Rollback migration to remove the market_rates table.
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('market_rates');
}