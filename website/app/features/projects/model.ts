import { z } from 'zod';

const projectItemSchema = z.object({
	familyId: z.string().min(1),
	family: z.string().min(1),
	displayName: z.string().min(1),
	category: z.enum([
		'sans-serif',
		'serif',
		'display',
		'handwriting',
		'monospace',
		'icons',
		'other',
	]),
	classification: z.string().min(1),
	tags: z.array(z.string().min(1)),
	designer: z.string().min(1).optional(),
	status: z.enum(['active', 'deprecated']),
	registryFactsCurrent: z.boolean().default(false),
	format: z.enum(['variable', 'static']),
	subset: z.string().min(1),
	style: z.enum(['normal', 'italic']),
	weight: z.number(),
	axes: z.record(z.string(), z.number()),
	packageName: z.string().min(1),
	packageVersion: z.string().min(1),
	cssFile: z.string().min(1),
	fontFamily: z.string().min(1),
	sampleText: z.string().min(1),
	symbolInputModes: z.array(z.enum(['codepoint', 'name-ligature'])).default([]),
	license: z.object({
		verified: z.boolean().default(false),
		id: z.string().min(1).optional(),
		url: z.string().min(1).optional(),
		attribution: z.string().min(1).optional(),
	}),
});

const currentProjectSnapshotSchema = z
	.object({
		version: z.literal(1),
		items: z.array(projectItemSchema),
	})
	.refine(
		(snapshot) =>
			new Set(snapshot.items.map((item) => item.familyId)).size ===
			snapshot.items.length,
		{ message: 'Selected Fonts can contain one setup per family.' },
	);

type ProjectItem = z.infer<typeof projectItemSchema>;
type CurrentProjectSnapshot = z.infer<typeof currentProjectSnapshotSchema>;

export type { CurrentProjectSnapshot, ProjectItem };
export { currentProjectSnapshotSchema };
