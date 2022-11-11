import type { Knex } from 'knex';

// First init migration
export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('fonts', t => {
        t.string('id').primary();
        t.string('name').notNullable();
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
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('fonts');
}

