import { type IDResponse } from 'common-api/types';
import { getVariableMetadata } from 'common-api/util';
import { StatusError } from 'itty-router';

const ACCEPTED_EXTENSIONS = ['woff2', 'woff', 'ttf', 'zip'] as const;
type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export const isAcceptedExtension = (
	extension: string,
): extension is AcceptedExtension =>
	ACCEPTED_EXTENSIONS.includes(extension as AcceptedExtension);

export const validateFontFilename = async (
	filename: string,
	metadata: IDResponse,
	req: Request,
	env: Env,
) => {
	const { id, weights, styles, subsets, variable } = metadata;
	// Check if filename starts with id
	if (!filename.startsWith(id)) {
		throw new StatusError(404, 'Not Found. Invalid filename.');
	}

	// Remove id substring from filename
	let filenameWithoutId = filename.replace(id, '');

	// Remove dash prefix from start of filename once
	if (filenameWithoutId.startsWith('-')) {
		filenameWithoutId = filenameWithoutId.replace('-', '');
	} else {
		throw new StatusError(404, 'Not Found. Invalid filename.');
	}

	const filenameArr = filenameWithoutId.split('-');
	const style = filenameArr.pop();
	const weight = filenameArr.pop();
	const subset = filenameArr.join('-');

	// Accept id-subset-weight-style
	if (
		style &&
		subsets.includes(subset) &&
		weights.includes(Number(weight)) &&
		styles.includes(style)
	) {
		return;
	}

	// Check variable variants
	if (variable) {
		const variableMetadata = await getVariableMetadata(id, req, env);

		const axes = weight;

		// Accept id-axes
		const axesKeys = Object.keys(variableMetadata.axes);
		if (axes && axesKeys.includes(axes)) {
			return;
		}

		// Accept id-axes-italic
		if (style === 'italic' && axes && axesKeys.includes(axes)) {
			return;
		}
	}

	throw new StatusError(404, 'Not Found. Invalid filename.');
};

export const validateCSSFilename = async (
	filename: string,
	metadata: IDResponse,
	req: Request,
	env: Env,
) => {
	const { id, weights, styles, subsets, variable } = metadata;
	// Accept index.css
	if (filename === 'index') {
		return;
	}

	// Accept weight.css
	if (weights.includes(Number(filename))) {
		return;
	}

	// Accept weight-style.css
	const [weight, style] = filename.split('-');
	if (weights.includes(Number(weight)) && styles.includes(style)) {
		return;
	}

	// Accept subset-weight-style.css
	const filenameArr = filename.split('-');
	const style2 = filenameArr.pop();
	const weight2 = filenameArr.pop();
	const subset = filenameArr.join('-');
	if (
		style2 &&
		subsets.includes(subset) &&
		weights.includes(Number(weight2)) &&
		styles.includes(style2)
	) {
		return;
	}

	// Check variable variants
	if (variable) {
		const variableMetadata = await getVariableMetadata(id, req, env);

		// Accept index.css, standard.css and full.css
		if (
			filename === 'index' ||
			filename === 'standard' ||
			filename === 'full'
		) {
			return;
		}

		// Accept axes.css
		const axesKeys = Object.keys(variableMetadata.axes);
		if (axesKeys.includes(filename)) {
			return;
		}

		// Accept axes-italic.css
		const [axes, italic] = filename.split('-');
		if (italic === 'italic' && axesKeys.includes(axes)) {
			return;
		}
	}

	throw new StatusError(404, 'Not Found. Invalid filename.');
};
