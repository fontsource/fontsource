/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable('axis_registry', (t) => {
		t.string('tag').primary();
		t.string('name').notNullable();
		t.string('description').notNullable();
		t.real('min').notNullable();
		t.real('max').notNullable();
		t.real('default').notNullable();
		t.integer('precision').notNullable();
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable('axis_registry');
};
