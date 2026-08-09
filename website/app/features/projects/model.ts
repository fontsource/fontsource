import { z } from 'zod';

const MAX_FONT_SET_SIZE = 100;

interface ResolvedFontSetFamily {
	familyId: string;
	family: string;
	displayName: string;
	category:
		| 'sans-serif'
		| 'serif'
		| 'display'
		| 'handwriting'
		| 'monospace'
		| 'icons'
		| 'other';
	classification: string;
	tags: string[];
	designer?: string;
	status: 'active' | 'deprecated';
	registryFactsCurrent: boolean;
	variableAvailable: boolean;
	defaultSubset: string;
	format: 'variable' | 'static';
	subset: string;
	style: 'normal' | 'italic';
	weight: number;
	axes: Record<string, number>;
	packageName: string;
	packageVersion: string;
	cssFile: string;
	fontFamily: string;
	sampleText: string;
	symbolInputModes: Array<'codepoint' | 'name-ligature'>;
	license: {
		verified: boolean;
		id?: string;
		url?: string;
		attribution?: string;
	};
}

const fontSetItemSchema = z.object({
	familyId: z.string().min(1),
});

const currentProjectSnapshotSchema = z
	.array(fontSetItemSchema)
	.max(MAX_FONT_SET_SIZE)
	.refine(
		(items) =>
			new Set(items.map((item) => item.familyId)).size === items.length,
		{ message: 'A Font Set can contain each family once.' },
	);

type FontSetItem = z.infer<typeof fontSetItemSchema>;
type CurrentProjectSnapshot = z.infer<typeof currentProjectSnapshotSchema>;

export type { CurrentProjectSnapshot, FontSetItem, ResolvedFontSetFamily };
export { currentProjectSnapshotSchema, MAX_FONT_SET_SIZE };
