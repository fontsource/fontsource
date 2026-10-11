import type { FontFace } from '@fontsource-utils/core/css';
import { z } from 'zod';

// Published package data is a versioned contract, independent of today's catalog.
const FaceSchema: z.ZodType<FontFace> = z.object({
	subset: z.string(),
	weight: z.union([z.number(), z.string()]),
	style: z.union([
		z.enum(['normal', 'italic']),
		z.templateLiteral(['oblique ', z.number(), 'deg']),
		z.templateLiteral(['oblique ', z.number(), 'deg ', z.number(), 'deg']),
	]),
	unicodeRange: z.string(),
	sliceIndex: z.number().int().nonnegative(),
	isVariable: z.boolean(),
	axisKey: z.string().optional(),
	stretch: z.string().nullable().optional(),
	sources: z
		.array(
			z.object({
				// Basenames are interpolated into public URLs; reject paths and URL syntax.
				filename: z
					.string()
					.regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(woff2|woff|ttf)$/),
				format: z.enum(['woff2', 'woff', 'ttf']),
			}),
		)
		.min(1),
});

export const PackageOutputSchema = z
	.object({
		schemaVersion: z.literal(1),
		family: z.string().min(1),
		sourceModified: z.iso.date(),
		faces: z.array(FaceSchema).min(1),
		entrypoints: z.record(
			z.string().endsWith('.css'),
			z.array(z.number().int().nonnegative()).min(1),
		),
	})
	.refine(
		({ faces, entrypoints }) =>
			Object.hasOwn(entrypoints, 'index.css') &&
			Object.values(entrypoints).every((indices) =>
				indices.every((index) => index < faces.length),
			),
		'Invalid CSS entrypoint references',
	);

export type PackageOutputManifest = z.infer<typeof PackageOutputSchema>;
