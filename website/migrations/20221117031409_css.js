/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('css', (t) => {
    t.string('id').notNullable();
    t.string('weight').notNullable();
    t.string('css').notNullable();
    t.boolean('isItalic').notNullable();
    t.boolean('isVariable').notNullable();
    t.boolean('isIndex').notNullable();
    t.primary(['id', 'weight', 'isItalic', 'isVariable']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('css');
};
