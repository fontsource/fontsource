import { z } from 'zod';

import type { ListRegistryFamiliesResponse } from '@/generated/api';

const MAX_FONT_SET_SIZE = 100;

interface ResolvedFontSetFamily {
	familyId: string;
	family: string;
	classification: ListRegistryFamiliesResponse[number]['classifications'][number];
	designer?: string;
	packageName: string;
	packageVersion: string;
	fontFamily: string;
	previewText?: string;
	license: {
		id: string;
		url?: string;
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
