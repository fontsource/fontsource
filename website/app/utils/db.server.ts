import { knex as knexSetup } from 'knex';

import config from '../../knexfile';

// Use prod config or dev config
export const knex = knexSetup(config[process.env.NODE_ENV ?? 'development']);
