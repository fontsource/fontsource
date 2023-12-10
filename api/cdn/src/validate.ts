import { type IDResponse, type VariableMetadata } from 'common-api/types';
import { StatusError } from 'itty-router';

import { isAcceptedExtension } from './util';

const isNumeric = (num: any) =>
	(typeof num === 'number' || (typeof num === 'string' && num.trim() !== '')) &&
	!Number.isNaN(num as number);

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
		// It could also be a numbered subset
		(subsets.includes(subset) || isNumeric(subset)) &&
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
	variableMeta?: VariableMetadata,
) => {
	if (!variableMeta) {
		throw new StatusError(400, 'Bad Request. Variable font not found.');
	}

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

	const isValidAxesKey =
		Boolean(axesKey && axes[axesKey]) ||
		axesKey === 'standard' ||
		axesKey === 'full';

	// Accept id-subset-axes-style
	if (
		(subsets.includes(subset) || isNumeric(subset)) &&
		isValidAxesKey &&
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
	variableMeta: VariableMetadata,
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
