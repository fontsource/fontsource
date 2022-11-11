/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('fonts', t => {
        t.string('id').primary();
        t.string('family').notNullable();
        t.string('subsets').notNullable();
        t.string('weights').notNullable();
        t.string('styles').notNullable();
        t.string('defSubset').notNullable();
        t.boolean('variable').notNullable();
        t.string('lastModified').notNullable();
        t.string('version').notNullable();
        t.string('category').notNullable();
        t.string('source').notNullable();
        t.string('license').notNullable();
        t.string('type').notNullable();
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('fonts');
};
