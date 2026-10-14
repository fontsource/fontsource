import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { RegistryFamilyDetailSchema } from '../../../../../shared/registry';
import {
	fetchCachedJson,
	fetchPackageOutput,
	UPSTREAM_URLS,
} from '../../../../../shared/upstream';
import { CACHE_POLICIES } from '../../../constants';
import type { AppEnv } from '../../../env';
import { badGateway, notFound } from '../../../utils/errors';

/** Reads an exact package directly; publication verification must not depend on the index it promotes. */
export const getPackageOutput = async (
	c: Context<AppEnv>,
	id: string,
	kind: 'static' | 'variable',
	version: string,
): Promise<Response> => {
	if (Number(version.split('.')[0]) < 6)
		throw notFound('Package output manifests are available from version 6.');
	const isVariable = kind === 'variable';
	const manifest = await fetchPackageOutput(id, version, isVariable);
	try {
		const scope = isVariable ? '@fontsource-variable' : '@fontsource';
		const metadata = RegistryFamilyDetailSchema.parse(
			await fetchCachedJson<unknown>(
				`${UPSTREAM_URLS.jsdelivrNpm}/${scope}/${id}@${version}/metadata.json`,
				86400,
			),
		);
		if (
			metadata.id !== id ||
			manifest.family !== metadata.family ||
			manifest.sourceModified !== metadata.sourceModified ||
			manifest.faces.some((face) => face.isVariable !== isVariable)
		)
			throw badGateway(
				'Bad Gateway. Package output does not match its metadata or scope.',
			);
		return c.json(
			{ id, kind, version, manifest, metadata },
			200,
			CACHE_POLICIES.immutable,
		);
	} catch (error) {
		if (error instanceof HTTPException) throw error;
		throw badGateway('Bad Gateway. Invalid or unavailable package metadata.');
	}
};
