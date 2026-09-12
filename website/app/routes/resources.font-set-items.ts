import type { ActionFunctionArgs } from 'react-router';

import { MAX_FONT_SET_SIZE } from '@/features/projects/model';
import { resolveFontSetFamily } from '@/features/projects/resolveFontSetFamily';
import { listRegistryFamilies, resolveFontPackages } from '@/generated/api';

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
	if (validIds.length === 0) {
		return { requestId, items: [], failedIds: invalidIds };
	}

	try {
		const options = { signal: request.signal };
		const [packages, registryFamilies] = await Promise.all([
			resolveFontPackages({ ids: validIds }, options),
			listRegistryFamilies(options),
		]);
		const registryById = new Map(
			registryFamilies.map((family) => [family.id, family]),
		);
		const items = packages.items.flatMap((artifact) => {
			const registry = registryById.get(artifact.id);
			const item = registry
				? resolveFontSetFamily({ artifact, registry })
				: undefined;
			return item ? [item] : [];
		});
		const resolvedIds = new Set(items.map((item) => item.familyId));
		return {
			requestId,
			items,
			failedIds: [
				...invalidIds,
				...validIds.filter((id) => !resolvedIds.has(id)),
			],
		};
	} catch (error) {
		if (request.signal.aborted) throw error;
		return {
			requestId,
			items: [],
			failedIds: fontIds,
			error: 'Font details could not be loaded. Try again.',
		};
	}
};
