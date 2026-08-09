import type { ActionFunctionArgs } from 'react-router';

import { resolveFontSetFamily } from '@/features/projects/createProjectItem';
import { MAX_FONT_SET_SIZE } from '@/features/projects/model';
import { loadFontFamilyRecord } from '@/utils/font-page.server';
import { processWithConcurrency } from '@/utils/processWithConcurrency';

const familyIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_FAMILY_ID_LENGTH = 96;

export const action = async ({ request }: ActionFunctionArgs) => {
	if (request.method !== 'POST') {
		return Response.json({ error: 'Method not allowed' }, { status: 405 });
	}

	const formData = await request.formData();
	const requestId = String(formData.get('requestId') ?? '');
	const submittedIds = formData
		.getAll('fontId')
		.filter((value): value is string => typeof value === 'string');
	const fontIds = [...new Set(submittedIds)];
	if (fontIds.length > MAX_FONT_SET_SIZE) {
		return Response.json(
			{
				requestId,
				items: [],
				failedIds: [],
				error: `A font set can contain up to ${MAX_FONT_SET_SIZE} families.`,
			},
			{ status: 413 },
		);
	}
	const invalidIds = fontIds.filter(
		(id) => id.length > MAX_FAMILY_ID_LENGTH || !familyIdPattern.test(id),
	);
	const validIds = fontIds.filter(
		(id) => id.length <= MAX_FAMILY_ID_LENGTH && familyIdPattern.test(id),
	);

	const { results } = await processWithConcurrency(
		validIds,
		async (id) => {
			try {
				const { metadata, versions, registry, variable } =
					await loadFontFamilyRecord(id, request.signal);

				return {
					id,
					item: resolveFontSetFamily({
						metadata,
						versions,
						variable,
						registry,
					}),
				};
			} catch (error) {
				if (request.signal.aborted) throw error;
				return { id };
			}
		},
		() => request.signal.aborted,
		4,
	);

	return {
		requestId,
		items: results.flatMap((result) => (result.item ? [result.item] : [])),
		failedIds: [
			...invalidIds,
			...results.flatMap((result) => (result.item ? [] : [result.id])),
		],
	};
};
