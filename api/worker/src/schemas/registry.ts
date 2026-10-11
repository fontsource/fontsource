import { z } from 'zod';

export const RegistryQuerySchema = z.object({
	revision: z
		.string()
		.regex(/^[0-9a-f]{40}$/)
		.optional()
		.describe(
			'Completed registry snapshot revision. Omit to use the current snapshot.',
		),
});
