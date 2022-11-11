import type { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('variable', t => { 
        t.string('id').primary();
        // We just stringify the JSON object and store it as is
        // Don't need specific columns for this
        t.string('data').notNullable();
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('variable');
}

