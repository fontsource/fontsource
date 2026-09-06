import type { Context } from 'hono';
import limitConcur from 'limit-concur';

import type { AppEnv } from '../../../env';
import { getFontIndex, getVersions } from '../store';

interface FontPackageItem {
	id: string;
	packageName: string;
	packageVersion: string;
	fontFamily: string;
}

/** Resolves the current standard package for multiple font families. */
export const resolveFontPackages = async (
	c: Context<AppEnv>,
	requestedIds: readonly string[],
): Promise<Response> => {
	const ids = [...new Set(requestedIds)];
	const fontsById = new Map(
		(await getFontIndex(c)).map((font) => [font.id, font]),
	);
	const resolved = await Promise.all(
		ids.map(
			limitConcur(8, async (id) => {
				const font = fontsById.get(id);
				if (!font) return { id };

				try {
					const versions = await getVersions(id, font.variable);
					const isVariable = Boolean(versions.latestVariable);
					const packageVersion = isVariable
						? versions.latestVariable
						: versions.latest;

					if (!packageVersion) {
						return { id };
					}

					return {
						id,
						item: {
							id,
							packageName: isVariable
								? `@fontsource-variable/${id}`
								: `@fontsource/${id}`,
							packageVersion,
							fontFamily: isVariable ? `${font.family} Variable` : font.family,
						} satisfies FontPackageItem,
					};
				} catch {
					return { id };
				}
			}),
		),
	);

	return c.json(
		{
			items: resolved.flatMap((result) => (result.item ? [result.item] : [])),
			failedIds: resolved.flatMap((result) => (result.item ? [] : [result.id])),
		},
		200,
	);
};
