import type { Context } from 'hono';
import { RegistryFamiliesSchema } from '../../../../../shared/registry';
import type { AppEnv } from '../../../env';
import { readRegistryView } from '../../registry/handler';
import { getFontById, getPublishedPackages } from '../store';

/** Resolve only promoted packages, preserving the existing variable preference. */
export const resolveFontPackages = async (
	c: Context<AppEnv>,
	requestedIds: readonly string[],
): Promise<Response> => {
	const [published, families] = await Promise.all([
		getPublishedPackages(c),
		readRegistryView(c, 'families.json', RegistryFamiliesSchema),
	]);
	const names = new Map(families.map((family) => [family.id, family.family]));
	const items = [];
	const failedIds: string[] = [];
	for (const id of new Set(requestedIds)) {
		const entry = published[id];
		const version = entry?.variable ?? entry?.static;
		// A few published V5 families predate the source registry.
		const family =
			names.get(id) ??
			(version && Number(version.split('.')[0]) < 6
				? (await getFontById(c, id))?.family
				: undefined);
		if (!family || !version) {
			failedIds.push(id);
			continue;
		}
		const variable = Boolean(entry.variable);
		items.push({
			id,
			packageName: `@fontsource${variable ? '-variable' : ''}/${id}`,
			packageVersion: version,
			fontFamily: variable ? `${family} Variable` : family,
		});
	}
	return c.json({ items, failedIds });
};
