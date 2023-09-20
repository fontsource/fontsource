import {
	type IDResponse,
	type VariableMetadataWithVariants,
} from 'common-api/types';
import { StatusError } from 'itty-router';

const ACCEPTED_EXTENSIONS = ['woff2', 'woff', 'ttf', 'zip'] as const;
type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export const isAcceptedExtension = (
	extension: string,
): extension is AcceptedExtension =>
	ACCEPTED_EXTENSIONS.includes(extension as AcceptedExtension);

export const validateFontFilename = (file: string, metadata: IDResponse) => {
	const [filename, extension] = file.split('.');
	if (!extension || !isAcceptedExtension(extension)) {
		throw new StatusError(400, 'Bad Request. Invalid file extension.');
	}

	if (file === 'download.zip') {
		return;
	}

	const { weights, styles, subsets } = metadata;

	const filenameArr = filename.split('-');
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

	throw new StatusError(404, 'Not Found. Invalid filename.');
};

export const validateVariableFontFileName = (
	file: string,
	metadata: IDResponse,
	variableMeta: VariableMetadataWithVariants,
) => {
	const [filename, extension] = file.split('.');
	if (!extension || extension !== 'woff2') {
		throw new StatusError(400, 'Bad Request. Invalid file extension.');
	}

	const { subsets, styles } = metadata;
	const { axes } = variableMeta;

	const filenameArr = filename.split('-');
	const style = filenameArr.pop();
	const axesKey = filenameArr.pop();
	const subset = filenameArr.join('-');

	// Accept id-subset-axes-style
	if (
		subsets.includes(subset) &&
		axesKey &&
		axes[axesKey] &&
		style &&
		styles.includes(style)
	) {
		return;
	}

	throw new StatusError(404, 'Not Found. Invalid filename.');
};

export const validateCSSFilename = (file: string, metadata: IDResponse) => {
	const [filename, extension] = file.split('.');
	if (!extension || extension !== 'css') {
		throw new StatusError(400, 'Bad Request. Invalid file extension.');
	}

	// Accept index.css
	if (filename === 'index') {
		return;
	}

	const { weights, styles, subsets } = metadata;

	// Accept weight.css
	if (weights.includes(Number(filename))) {
		return;
	}

	// Accept weight-italic.css
	let weight, style, subset;
	[weight, style] = filename.split('-');
	if (
		weights.includes(Number(weight)) &&
		style === 'italic' &&
		styles.includes(style)
	) {
		return;
	}

	// Accept subset-weight.css
	const subsetWeight = filename.split('-');
	weight = subsetWeight.pop();
	subset = subsetWeight.join('-');
	if (subsets.includes(subset) && weights.includes(Number(weight))) {
		return;
	}

	// Accept subset-weight-style.css
	const subsetWeightStyle = filename.split('-');
	style = subsetWeightStyle.pop();
	weight = subsetWeightStyle.pop();
	subset = subsetWeightStyle.join('-');
	if (
		style &&
		subsets.includes(subset) &&
		weights.includes(Number(weight)) &&
		styles.includes(style)
	) {
		return;
	}

	throw new StatusError(404, 'Not Found. Invalid filename.');
};

export const validateVCSSFilename = (
	file: string,
	variableMeta: VariableMetadataWithVariants,
) => {
	const [filename, extension] = file.split('.');
	if (!extension || extension !== 'css') {
		throw new StatusError(400, 'Bad Request. Invalid file extension.');
	}

	const { axes } = variableMeta;
	// Accept index.css
	if (filename === 'index') {
		return;
	}

	// Accept standard.css and full.css
	if (filename === 'standard' || filename === 'full') {
		return;
	}

	// Accept axes.css
	const axesKeys = Object.keys(axes);
	if (axesKeys.includes(filename)) {
		return;
	}

	// Accept axes-italic.css
	const [axesKey, italic] = filename.split('-');
	if (italic === 'italic' && axesKeys.includes(axesKey)) {
		return;
	}

	throw new StatusError(404, 'Not Found. Invalid filename.');
};
