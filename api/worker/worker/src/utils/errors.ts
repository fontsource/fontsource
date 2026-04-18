import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const DEFAULT_NOT_FOUND_MESSAGE = `Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api`;
const DEFAULT_INTERNAL_ERROR = 'Internal Server Error.';

export const badRequest = (message: string): HTTPException =>
	new HTTPException(400, { message });

export const notFound = (message: string): HTTPException =>
	new HTTPException(404, { message });

export const badGateway = (message: string): HTTPException =>
	new HTTPException(502, { message });

const getMessage = (error: unknown): string =>
	error instanceof Error ? error.message : DEFAULT_INTERNAL_ERROR;

/**
 * Normalizes thrown errors into the legacy JSON error envelope.
 */
export const toErrorResponse = (c: Context, error: unknown): Response => {
	const status = error instanceof HTTPException ? error.status : 500;
	const message =
		status === 404 && getMessage(error) === DEFAULT_INTERNAL_ERROR
			? DEFAULT_NOT_FOUND_MESSAGE
			: getMessage(error);

	return c.json(
		{
			status,
			error: message,
		},
		{ status: status as 400 | 404 | 500 | 502 },
	);
};
