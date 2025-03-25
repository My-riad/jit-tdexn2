import { Knex } from 'knex';

/**
 * Migration to create driver_positions table for storing historical position data
 * This table is designed for high-volume time-series geospatial data with efficient querying capabilities
 * 
 * @param knex - Knex instance
 * @returns Promise resolving when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Enable PostGIS extension if not already enabled
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');
  
  // Create driver_positions table
  await knex.schema.createTable('driver_positions', (table) => {
    // Primary key
    table.uuid('position_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Reference to driver
    table.uuid('driver_id').notNullable().index();
    
    // Entity type (allows for future expansion to track other entities)
    table.enum('entity_type', ['DRIVER', 'VEHICLE', 'LOAD', 'SMART_HUB'], {
      useNative: true,
      enumName: 'position_entity_type'
    }).notNullable().defaultTo('DRIVER');
    
    // Geospatial coordinates
    table.decimal('latitude', 10, 6).notNullable();
    table.decimal('longitude', 10, 6).notNullable();
    
    // Movement data
    table.decimal('heading', 5, 2).nullable().comment('Direction in degrees (0-359)');
    table.decimal('speed', 8, 2).nullable().comment('Speed in km/h');
    table.decimal('accuracy', 8, 2).nullable().comment('Accuracy in meters');
    
    // Data source tracking
    table.enum('source', ['MOBILE_APP', 'ELD', 'GPS_DEVICE', 'MANUAL', 'SYSTEM'], {
      useNative: true,
      enumName: 'position_data_source'
    }).notNullable().defaultTo('MOBILE_APP');
    
    // Timestamps
    table.timestamp('recorded_at').notNullable().index()
      .comment('When the position was actually recorded');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      .comment('When the record was created in the database');
    
    // Foreign key constraint
    table.foreign('driver_id')
      .references('driver_id')
      .inTable('drivers')
      .onDelete('CASCADE');
  });
  
  // Add PostGIS geography column for efficient geospatial queries
  await knex.raw(`
    ALTER TABLE driver_positions 
    ADD COLUMN geography GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS 
    (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED
  `);
  
  // Create composite index for efficient time-series queries
  await knex.raw(`
    CREATE INDEX idx_driver_positions_driver_time 
    ON driver_positions (driver_id, recorded_at DESC)
  `);
  
  // Create spatial index for geospatial queries
  await knex.raw(`
    CREATE INDEX idx_driver_positions_geography 
    ON driver_positions USING GIST (geography)
  `);
  
  // Set up time-based partitioning by month
  await knex.raw(`
    ALTER TABLE driver_positions 
    PARTITION BY RANGE (recorded_at);
  `);
  
  // Create initial partitions (current month and next month)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Create partition for current month
  await knex.raw(`
    CREATE TABLE driver_positions_y${currentYear}m${currentMonth} 
    PARTITION OF driver_positions 
    FOR VALUES FROM ('${currentYear}-${currentMonth}-01') 
    TO ('${currentYear}-${currentMonth + 1 > 12 ? 1 : currentMonth + 1}-01');
  `);
  
  // Create partition for next month
  const nextMonth = currentMonth + 1 > 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth + 1 > 12 ? currentYear + 1 : currentYear;
  await knex.raw(`
    CREATE TABLE driver_positions_y${nextYear}m${nextMonth} 
    PARTITION OF driver_positions 
    FOR VALUES FROM ('${nextYear}-${nextMonth}-01') 
    TO ('${nextYear}-${nextMonth + 1 > 12 ? 1 : nextMonth + 1}-01');
  `);
  
  // Create partition management function for automated maintenance
  await knex.raw(`
    CREATE OR REPLACE FUNCTION manage_driver_positions_partitions()
    RETURNS VOID AS $$
    DECLARE
      current_date DATE := NOW();
      next_month DATE := (NOW() + INTERVAL '1 month')::DATE;
      partition_table TEXT;
      partition_start_date DATE;
      partition_end_date DATE;
      retention_months INT := 3; -- Keep 3 months of detailed data
    BEGIN
      -- Create next month's partition if it doesn't exist
      partition_table := 'driver_positions_y' 
                       || EXTRACT(YEAR FROM next_month) 
                       || 'm' 
                       || EXTRACT(MONTH FROM next_month);
      partition_start_date := DATE_TRUNC('month', next_month);
      partition_end_date := partition_start_date + INTERVAL '1 month';
      
      IF NOT EXISTS (
        SELECT FROM pg_tables WHERE tablename = partition_table
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF driver_positions FOR VALUES FROM (%L) TO (%L)',
          partition_table, partition_start_date, partition_end_date
        );
        RAISE NOTICE 'Created partition % for date range % to %', 
          partition_table, partition_start_date, partition_end_date;
      END IF;
      
      -- Drop old partitions beyond retention period
      FOR partition_table IN 
        SELECT tablename FROM pg_tables 
        WHERE tablename LIKE 'driver_positions_y%'
          AND tablename ~ '^driver_positions_y[0-9]{4}m[0-9]{1,2}$'
      LOOP
        -- Extract date from partition name
        BEGIN
          partition_start_date := TO_DATE(
            SUBSTRING(partition_table FROM 'y([0-9]{4})m([0-9]{1,2})$', 1) || '-' ||
            SUBSTRING(partition_table FROM 'y([0-9]{4})m([0-9]{1,2})$', 2) || '-01',
            'YYYY-MM-DD'
          );
          
          -- Drop if older than retention period
          IF partition_start_date < (current_date - (retention_months * INTERVAL '1 month')) THEN
            EXECUTE format('DROP TABLE %I', partition_table);
            RAISE NOTICE 'Dropped old partition % (start date: %)', 
              partition_table, partition_start_date;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error processing partition %: %', partition_table, SQLERRM;
        END;
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Create a cron job to run the partition management function (requires pg_cron extension)
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
      ) THEN
        PERFORM cron.schedule('0 0 * * *', 'SELECT manage_driver_positions_partitions()');
      ELSE
        RAISE NOTICE 'pg_cron extension not installed. Manual partition management will be required.';
      END IF;
    END;
    $$;
  `);
  
  // Add table comment
  await knex.raw(`
    COMMENT ON TABLE driver_positions IS 
    'Stores historical position data for drivers with time-based partitioning. 
    Data retention policy: detailed data for 3 months, then aggregated for analytics.
    This table supports real-time tracking, historical route analysis, and optimization model training.';
  `);
}

/**
 * Rollback migration by dropping the driver_positions table and related objects
 * 
 * @param knex - Knex instance
 * @returns Promise resolving when rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Remove partition management cron job if pg_cron is installed
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
      ) THEN
        PERFORM cron.unschedule('SELECT manage_driver_positions_partitions()');
      END IF;
    END;
    $$;
  `);
  
  // Drop the partition management function
  await knex.raw(`DROP FUNCTION IF EXISTS manage_driver_positions_partitions()`);
  
  // Drop the driver_positions table (will cascade to all partitions)
  await knex.schema.dropTableIfExists('driver_positions');
  
  // Drop the enum types
  await knex.raw(`DROP TYPE IF EXISTS position_entity_type`);
  await knex.raw(`DROP TYPE IF EXISTS position_data_source`);
}