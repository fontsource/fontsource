/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('docs', (t) => {
		t.string('route').primary();
		t.string('content').notNullable();
		t.string('title').notNullable();
		t.string('section').notNullable();
		t.string('description');
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('docs');
};
