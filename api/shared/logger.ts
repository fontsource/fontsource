import pino from 'pino';
import { errWithCause } from 'pino-std-serializers';

export const logger = pino({
	level: 'error',
	serializers: { err: errWithCause },
	browser: { asObject: true, serialize: true },
});
