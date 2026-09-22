import type { ActionFunctionArgs } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listRegistryFamilies, resolveFontPackages } from '@/generated/api';
import { action } from '@/routes/resources.font-set-items';

vi.mock('@/generated/api', () => ({
	listRegistryFamilies: vi.fn(),
	resolveFontPackages: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());

const requestFor = (ids: string[], signal?: AbortSignal) => {
	const body = new FormData();
	body.set('requestId', 'request-1');
	for (const id of ids) body.append('fontId', id);
	return {
		request: new Request('http://localhost/resources/font-set-items', {
			method: 'POST',
			body,
			signal,
		}),
	} as ActionFunctionArgs;
};

describe('font set metadata', () => {
	it('returns resolved selections and invalid or unpublished IDs', async () => {
		vi.mocked(resolveFontPackages).mockResolvedValue({
			items: [
				{
					id: 'inter',
					packageName: '@fontsource-variable/inter',
					packageVersion: '5.3.0',
					fontFamily: 'Inter Variable',
				},
			],
			failedIds: ['unpublished'],
		});
		vi.mocked(listRegistryFamilies).mockResolvedValue([
			{
				id: 'inter',
				family: 'Inter',
				provider: 'google',
				status: 'active',
				classifications: ['sans-serif'],
				tags: [],
				sourceModified: '2026-08-25',
				axes: ['wght'],
				license: { id: 'OFL-1.1', url: 'https://openfontlicense.org' },
			},
		]);
		const result = await action(
			requestFor(['inter', 'inter', 'unpublished', '../invalid']),
		);
		expect(result).toMatchObject({
			requestId: 'request-1',
			items: [{ familyId: 'inter', packageVersion: '5.3.0' }],
			failedIds: ['../invalid', 'unpublished'],
		});
	});
});
