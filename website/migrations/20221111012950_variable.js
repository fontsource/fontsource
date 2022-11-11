/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('variable', t => { 
        t.string('id').primary();
        // We just stringify the JSON object and store it as is
        // Don't need specific columns for this
        t.string('data').notNullable();
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('variable');
};
