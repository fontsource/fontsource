import { Axes, Metadata, UnicodeRange } from '../types';
import { findClosest, sassVar } from '../utils';

const axesValue = (metadata: Metadata) => {
	if (metadata.variable && Object.keys(metadata.variable).length > 0) {
		let out = '(\n';
		for (const variable of Object.keys(metadata.variable)) {
			const axis = (metadata.variable as Axes)[variable];
			out += `  ${variable}: (
    default: ${axis.default},
    min: ${axis.min},
    max: ${axis.max},
    step: ${axis.step},
  ),
`;
		}
		out += ')';

		return out;
	}

	return 'null';
};

const unicodeValue = (unicode: UnicodeRange) => {
	if (Object.keys(unicode).length > 0) {
		let out = '(\n';

		for (const unicodeKey of Object.keys(unicode)) {
			const unicodeVal = unicode[unicodeKey];

			out += `  ${unicodeKey
				.replace('[', '')
				.replace(']', '')}: (${unicodeVal}),\n`;
		}

		out += ')';

		return out;
	}

	return 'null';
};

const defaultAxis = (metadata: Metadata) => {
	const axes = Object.keys(metadata.variable);

	if (axes.length > 0) {
		if (axes.includes('wght')) return 'wght';
		if (axes.includes('full')) return 'full';
		return axes[0];
	}

	return 'null';
};

export const sassMetadata = (metadata: Metadata, unicode: UnicodeRange) => {
	let out = '';

	out += sassVar('id', `'${metadata.id}'`);
	out += sassVar('family', `'${metadata.family}'`);
	out += sassVar('category', `${metadata.category}`);
	out += sassVar('subsets', `(${metadata.subsets.join(', ')})`);
	out += sassVar('weights', `(${metadata.weights.join(', ')})`);
	out += sassVar('styles', `(${metadata.styles.join(', ')})`);
	out += sassVar('axes', axesValue(metadata));
	out += sassVar(
		'defaults',
		`(
  subset: ${metadata.defSubset},
  weight: ${findClosest(metadata.weights, 400)},
  style: normal,
  axis: ${defaultAxis(metadata)},
)`
	);
	out += sassVar('unicode', unicodeValue(unicode));

	return out;
};
