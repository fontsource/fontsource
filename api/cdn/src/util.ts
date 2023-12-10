import { findVersion, getVersion } from 'common-api/util';
import { StatusError } from 'itty-router';

const ACCEPTED_EXTENSIONS = ['woff2', 'woff', 'ttf', 'zip'] as const;
type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

interface Tag {
	id: string;
	version: string;
	isVariable: boolean;
}

export const isAcceptedExtension = (
	extension: string,
): extension is AcceptedExtension =>
	ACCEPTED_EXTENSIONS.includes(extension as AcceptedExtension);

export const splitTag = async (
	tag: string,
	req: Request,
	env: Env,
): Promise<Tag> => {
	// Parse tag for version e.g roboto@1.1.1
	const [idTag, versionTag] = tag.split('@');
	const [id, isVariable] = idTag.split(':');

	if (!id) {
		throw new StatusError(
			400,
			'Bad Request. Unable to parse font ID from tag.',
		);
	}
	if (!versionTag) {
		throw new StatusError(
			400,
			'Bad Request. Unable to parse version tag from tag.',
		);
	}
	if (isVariable && isVariable !== 'vf') {
		throw new StatusError(
			400,
			'Bad Request. Invalid variable font tag. Must appended with :vf.',
		);
	}

	// Don't support version tags below v5
	if (!versionTag.startsWith('5') && versionTag !== 'latest') {
		throw new StatusError(
			400,
			'Bad Request. Version tags below @5 are not supported.',
		);
	}

	// Validate version tag
	const {
		static: staticVar,
		variable,
		latest,
		latestVariable,
	} = await getVersion(id, req, env);

	if (versionTag === 'latest') {
		if (isVariable) {
			if (!latestVariable) {
				throw new StatusError(
					404,
					`Not found. Version ${versionTag} not found for ${id}.`,
				);
			}
			return { id, version: latestVariable, isVariable: Boolean(isVariable) };
		}

		return { id, version: latest, isVariable: Boolean(isVariable) };
	}

	if (isVariable) {
		if (!variable) {
			throw new StatusError(
				404,
				`Not found. Version ${versionTag} not found for ${id}.`,
			);
		}

		return {
			id,
			version: findVersion(id, versionTag, variable),
			isVariable: Boolean(isVariable),
		};
	}

	return {
		id,
		version: findVersion(id, versionTag, staticVar),
		isVariable: Boolean(isVariable),
	};
};
