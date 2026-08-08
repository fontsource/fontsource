import type { ActionFunctionArgs } from 'react-router';

import { createDefaultProjectItem } from '@/features/projects/createProjectItem';
import {
	getFont,
	getFontVersions,
	getRegistryFamily,
	getVariableFont,
} from '@/generated/api';
import { processWithConcurrency } from '@/utils/processWithConcurrency';
import { loadOptionalRegistryData } from '@/utils/registry-request.server';

const familyIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_FONT_SET_IMPORT_SIZE = 100;
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
	if (fontIds.length > MAX_FONT_SET_IMPORT_SIZE) {
		return Response.json(
			{
				requestId,
				items: [],
				failedIds: [],
				error: `A collection can add up to ${MAX_FONT_SET_IMPORT_SIZE} fonts at once.`,
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
				const parameters = { id };
				const options = { signal: request.signal };
				const metadataPromise = getFont(parameters, options);
				const variablePromise = metadataPromise.then((metadata) =>
					metadata.variable
						? getVariableFont(parameters, options).catch((error) => {
								if (request.signal.aborted) throw error;
								return undefined;
							})
						: undefined,
				);
				const [metadata, versions, registryResult, variable] =
					await Promise.all([
						metadataPromise,
						getFontVersions(parameters, options),
						loadOptionalRegistryData(
							getRegistryFamily(parameters, options),
							request.signal,
						),
						variablePromise,
					]);

				return {
					id,
					item: createDefaultProjectItem({
						metadata,
						versions,
						variable,
						registry: registryResult.value,
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
