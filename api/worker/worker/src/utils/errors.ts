import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const DEFAULT_NOT_FOUND_MESSAGE =
	'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api';

export const badRequest = (message: string): HTTPException =>
	new HTTPException(400, { message });

export const notFound = (message: string): HTTPException =>
	new HTTPException(404, { message });

export const badGateway = (message: string): HTTPException =>
	new HTTPException(502, { message });

/**
 * Normalizes thrown errors into the { status, error } JSON envelope.
 *
 * Chanfana v3 wraps validation errors as HTTPException({ res }); the details
 * live in the response body. We parse those out so the API surface stays
 * consistent.
 */
export const toErrorResponse = async (
	c: Context,
	error: unknown,
): Promise<Response> => {
	// Chanfana validation errors: HTTPException with a pre-built response body.
	if (error instanceof HTTPException && error.res) {
		try {
			const { errors } = (await error.res.clone().json()) as {
				errors?: Array<{ message: string; path?: string[] | null }>;
			};
			if (Array.isArray(errors) && errors.length > 0) {
				const parts = errors.map(({ message, path }) =>
					Array.isArray(path) && path.length > 0
						? `${path.join('.')}: ${message}`
						: message,
				);
				return c.json(
					{ status: error.status, error: `Bad Request. ${parts.join('; ')}.` },
					error.status as 400,
				);
			}
		} catch {
			// fall through
		}
	}

	const status = error instanceof HTTPException ? error.status : 500;
	const message =
		error instanceof Error ? error.message : 'Internal Server Error.';

	return c.json({ status, error: message }, status as 400 | 404 | 500 | 502);
};
