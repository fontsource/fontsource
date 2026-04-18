import { OpenAPIRoute } from 'chanfana';
import type { z } from 'zod';

/**
 * Base route class for all Fontsource API endpoints.
 *
 * Overrides chanfana's default validation-error response so that request
 * validation failures return the same JSON error envelope used by the rest
 * of the API: `{ status, error }`.
 */
export class FontsourceRoute extends OpenAPIRoute {
	override handleValidationError(errors: z.ZodIssue[]): Response {
		const messages = errors.map((issue) => {
			const path = issue.path.length > 0 ? issue.path.join('.') : undefined;
			return path ? `${path}: ${issue.message}` : issue.message;
		});

		return Response.json(
			{
				status: 400,
				error: `Bad Request. ${messages.join('; ')}.`,
			},
			{ status: 400 },
		);
	}
}
