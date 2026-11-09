import { z } from 'zod';
import { PackageOutputSchema } from './package-output.ts';
import {
	RegistryFamilyDetailSchema,
	RegistryIdParamSchema,
} from './registry.ts';

export const PreparedArtifactIdSchema = z.string().regex(/^[0-9a-f]{64}$/);
export const PreparedArtifactParamsSchema = RegistryIdParamSchema.extend({
	kind: z.enum(['static', 'variable']),
});
export const PreparedArtifactPathSchema = z
	.string()
	.regex(
		/^(?:[a-zA-Z0-9][a-zA-Z0-9._-]*\.css|files\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.woff2)$/,
	);

export const PreparedArtifactSchema = z
	.object({
		schemaVersion: z.literal(1),
		...PreparedArtifactParamsSchema.shape,
		artifact: PreparedArtifactIdSchema,
		profile: z.string().min(1),
		metadata: RegistryFamilyDetailSchema,
		manifest: PackageOutputSchema,
		files: z
			.array(
				z.object({
					path: PreparedArtifactPathSchema,
					sha256: PreparedArtifactIdSchema,
					size: z.number().int().positive(),
					url: z.string().startsWith('/v1/registry/families/'),
				}),
			)
			.min(1),
	})
	.superRefine((value, context) => {
		const paths = new Set(value.files.map((file) => file.path));
		const sources = new Set(
			value.metadata.sources.map((source) => source.sha256),
		);
		if (
			value.metadata.id !== value.id ||
			!value.metadata.distribution[value.kind] ||
			value.metadata.distribution[value.kind]?.some(
				(target) => !sources.has(target.source),
			) ||
			value.manifest.family !== value.metadata.family ||
			value.manifest.sourceModified !== value.metadata.sourceModified ||
			paths.size !== value.files.length ||
			Object.keys(value.manifest.entrypoints).some(
				(path) => !paths.has(path),
			) ||
			value.manifest.faces.some(
				(face) =>
					face.isVariable !== (value.kind === 'variable') ||
					face.sources.some(
						(source) =>
							source.format !== 'woff2' ||
							!paths.has(`files/${source.filename}`),
					),
			) ||
			value.files.some(
				(file) =>
					file.url !==
					`${preparedArtifactUrl(value.id, value.kind, value.artifact)}/${file.path}`,
			)
		)
			context.addIssue({
				code: 'custom',
				message: 'Artifact files do not match their family, kind, or manifest',
			});
	});

export type PreparedArtifact = z.infer<typeof PreparedArtifactSchema>;
export const preparedArtifactPrefix = (
	id: string,
	kind: string,
	artifact: string,
) => `prepared/${id}/${kind}/${artifact}`;
export const preparedArtifactUrl = (
	id: string,
	kind: string,
	artifact: string,
) => `/v1/registry/families/${id}/artifacts/${kind}/${artifact}`;
