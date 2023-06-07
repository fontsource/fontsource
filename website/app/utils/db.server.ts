import { knex as knexSetup } from 'knex';

import config from '../../knexfile';

// @ts-expect-error - Use prod config or dev config
export const knex = knexSetup(config[process.env.NODE_ENV ?? 'development']);
