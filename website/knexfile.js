// Update with your config settings.
const config = {
	development: {
		client: 'better-sqlite3',
		connection: {
			filename: './sqlite.dev.db',
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: './migrations',
		},
		// Better stack traces at the cost of performance
		asyncStackTraces: true,
		useNullAsDefault: true,
	},

	production: {
		client: 'better-sqlite3',
		connection: {
			filename: process.env.DATABASE_URL,
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: './migrations',
		},
		useNullAsDefault: true,
	},
};

export default config;
