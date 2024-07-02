import type {
	IDResponse,
	VariableMetadata,
	VariableMetadataWithVariants,
	VariableVariants,
} from 'common-api/types';
import { findVersion, getVersion } from 'common-api/util';
import { StatusError } from 'itty-router';

import { makeFontFileVariablePath } from './css';

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

export const generateVariableVariants = (
	metadata: IDResponse,
	variableMeta: VariableMetadata,
): VariableMetadataWithVariants => {
	const variants: VariableVariants = {};
	// Remove ital from axes keys if it exists
	const keys = Object.keys(variableMeta.axes).filter((key) => key !== 'ital');

	for (const axis of keys) {
		variants[axis] = {};

		for (const style of metadata.styles) {
			variants[axis][style] = {};

			for (const unicodeKey of Object.keys(metadata.unicodeRange)) {
				const subset = unicodeKey.replace('[', '').replace(']', '');
				const value = makeFontFileVariablePath(
					metadata.family,
					style,
					subset,
					axis,
				);
				variants[axis][style][subset] = value;
			}
		}
	}

	// Check if axes have any of the following standard keys
	const standardKeys = new Set(['wght', 'wdth', 'slnt', 'opsz']);
	const isStandard = keys.some((key) => standardKeys.has(key));
	if (isStandard) {
		for (const style of metadata.styles) {
			variants.standard = {};
			variants.standard[style] = {};

			for (const subset of metadata.subsets) {
				const value = makeFontFileVariablePath(
					metadata.family,
					style,
					subset,
					'standard',
				);
				variants.standard[style][subset] = value;
			}
		}
	}

	// Check if axes do not match the standard keys
	const isFull = keys.some((key) => !standardKeys.has(key));
	if (isFull) {
		for (const style of metadata.styles) {
			variants.full = {};
			variants.full[style] = {};

			for (const unicodeKey of Object.keys(metadata.unicodeRange)) {
				const subset = unicodeKey.replace('[', '').replace(']', '');
				const value = makeFontFileVariablePath(
					metadata.family,
					style,
					subset,
					'full',
				);
				variants.full[style][subset] = value;
			}
		}
	}

	return {
		...variableMeta,
		variants,
	};
};
