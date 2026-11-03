import type { Context } from 'hono';
import {
	PreparedArtifactIdSchema,
	PreparedArtifactSchema,
	preparedArtifactPrefix,
} from '../../../../shared/prepared-artifacts';
import { CACHE_POLICIES } from '../../constants';
import type { AppEnv } from '../../env';
import { badGateway, notFound } from '../../utils/errors';

const readManifest = async (
	c: Context<AppEnv>,
	id: string,
	kind: string,
	artifact: string,
) => {
	const object = await c.env.FONTS.get(
		`${preparedArtifactPrefix(id, kind, artifact)}/manifest.json`,
	);
	if (!object)
		throw notFound('Not Found. Completed font artifacts do not exist.');
	const parsed = PreparedArtifactSchema.safeParse(
		await object.json().catch(() => null),
	);
	if (
		!parsed.success ||
		parsed.data.id !== id ||
		parsed.data.kind !== kind ||
		parsed.data.artifact !== artifact
	)
		throw badGateway('Bad Gateway. Font artifact manifest is invalid.');
	return { object, manifest: parsed.data };
};

export const getPreparedArtifact = async (
	c: Context<AppEnv>,
	id: string,
	kind: string,
	pinned?: string,
) => {
	let artifact = pinned;
	if (!artifact) {
		const pointer = await c.env.FONTS.get(
			`prepared/${id}/${kind}/current.json`,
		);
		if (!pointer)
			throw notFound('Not Found. Completed font artifacts do not exist.');
		const parsed = PreparedArtifactIdSchema.safeParse(
			await pointer.json().catch(() => null),
		);
		if (!parsed.success)
			throw badGateway('Bad Gateway. Font artifact reference is invalid.');
		artifact = parsed.data;
	}
	const { object, manifest } = await readManifest(c, id, kind, artifact);
	const headers = new Headers(
		pinned ? CACHE_POLICIES.immutable : CACHE_POLICIES.metadata,
	);
	headers.set('Content-Type', 'application/json; charset=utf-8');
	headers.set('ETag', object.httpEtag);
	return new Response(JSON.stringify(manifest), { headers });
};

export const getPreparedArtifactFile = async (
	c: Context<AppEnv>,
	id: string,
	kind: string,
	artifact: string,
	path: string,
) => {
	// Files are not public until their complete manifest is present.
	const { manifest } = await readManifest(c, id, kind, artifact);
	const file = manifest.files.find((file) => file.path === path);
	if (!file) throw notFound('Not Found. Font artifact file does not exist.');
	const conditional = new Headers();
	const ifNoneMatch = c.req.header('If-None-Match');
	if (ifNoneMatch) conditional.set('If-None-Match', ifNoneMatch);
	const object = await c.env.FONTS.get(
		`${preparedArtifactPrefix(id, kind, artifact)}/${path}`,
		{
			onlyIf: conditional,
		},
	);
	if (
		!object ||
		object.size !== file.size ||
		object.customMetadata?.sha256 !== file.sha256
	)
		throw badGateway('Bad Gateway. Font artifact file is missing or invalid.');
	const headers = new Headers(CACHE_POLICIES.immutable);
	headers.set('ETag', object.httpEtag);
	headers.set(
		'Content-Type',
		path.endsWith('.css') ? 'text/css; charset=utf-8' : 'font/woff2',
	);
	headers.set('Last-Modified', object.uploaded.toUTCString());
	return new Response('body' in object ? object.body : null, {
		status: 'body' in object ? 200 : 304,
		headers,
	});
};
