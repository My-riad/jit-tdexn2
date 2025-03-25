import { Knex } from 'knex';

/**
 * Migration function that creates the notifications table and related tables for
 * the notification system of the AI-driven Freight Optimization Platform.
 * 
 * @param knex Knex instance
 * @returns Promise that resolves when the migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Create notification_channels table
  await knex.schema.createTable('notification_channels', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).notNullable();
    table.string('type', 50).notNullable().comment('email, sms, push, in_app');
    table.jsonb('config').nullable().comment('Channel-specific configuration');
    table.string('status', 20).notNullable().defaultTo('active').comment('active, inactive');
    table.boolean('is_default').notNullable().defaultTo(false);
    table.integer('priority').notNullable().defaultTo(0).comment('Higher number = higher priority');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Add unique constraint on name
    table.unique(['name']);
  });

  // Create notification_preferences table
  await knex.schema.createTable('notification_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().comment('Reference to the user');
    table.string('notification_type', 100).notNullable()
      .comment('Type of notification: load_opportunity, status_update, achievement, system_alert, etc.');
    
    // Channel preferences
    table.specificType('channel_ids', 'uuid[]')
      .comment('Array of channel IDs the user wants to receive this notification type through');
    
    // General settings
    table.boolean('enabled').notNullable().defaultTo(true);
    table.string('frequency', 50).defaultTo('immediately')
      .comment('immediately, daily_digest, weekly_digest');
    
    // Time restrictions
    table.jsonb('time_restrictions').nullable()
      .comment('JSON object containing time restrictions (e.g., quiet hours)');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Add unique constraint
    table.unique(['user_id', 'notification_type']);
  });

  // Create main notifications table
  await knex.schema.createTable('notifications', (table) => {
    // Identity columns
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('recipient_id').notNullable().index()
      .comment('ID of the recipient (usually user_id)');
    table.string('recipient_type', 50).notNullable().defaultTo('user')
      .comment('Type of recipient: user, driver, carrier, shipper');
    table.string('notification_type', 100).notNullable().index()
      .comment('Type of notification: load_opportunity, status_update, achievement, system_alert, etc.');
    
    // Content columns
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.jsonb('data').nullable().comment('Additional structured data related to the notification');
    table.string('priority', 20).notNullable().defaultTo('normal')
      .comment('high, normal, low');
    table.specificType('channels', 'text[]').nullable()
      .comment('Array of channel types through which the notification was sent');
    table.string('action_url', 1024).nullable()
      .comment('URL or deep link for user action');
    
    // Status tracking columns
    table.timestamp('expires_at').nullable()
      .comment('When this notification should expire');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.jsonb('delivery_status').defaultTo(JSON.stringify({}))
      .comment('Status of delivery attempts per channel');
    
    // Template reference
    table.uuid('template_id').nullable().index()
      .comment('Reference to the template used to generate this notification');
    
    // Audit columns
    table.uuid('created_by').nullable().comment('ID of the user or system that created the notification');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create notification_templates table
  await knex.schema.createTable('notification_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('type', 100).notNullable()
      .comment('The notification_type this template is for');
    
    // Content columns
    table.string('subject', 255).nullable().comment('Subject line for email notifications');
    table.text('body').notNullable().comment('Template body with placeholders');
    table.jsonb('variables').notNullable().defaultTo(JSON.stringify([]))
      .comment('Array of variables used in the template');
    table.integer('version').notNullable().defaultTo(1)
      .comment('Template version for tracking changes');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Add unique constraint
    table.unique(['name', 'version']);
  });

  // Create indexes for common query patterns
  await knex.raw(`
    CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_id, is_read);
    CREATE INDEX idx_notifications_created_at ON notifications (created_at);
    CREATE INDEX idx_notifications_expires_at ON notifications (expires_at);
    CREATE INDEX idx_notification_preferences_user_enabled ON notification_preferences (user_id, enabled);
  `);

  // Add foreign key constraints
  await knex.schema.alterTable('notification_preferences', (table) => {
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });

  await knex.schema.alterTable('notifications', (table) => {
    table.foreign('template_id').references('id').inTable('notification_templates').onDelete('SET NULL');
  });
}

/**
 * Rollback function that removes the notifications table and related tables
 * 
 * @param knex Knex instance
 * @returns Promise that resolves when the rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('notification_templates');
  await knex.schema.dropTableIfExists('notification_channels');
}