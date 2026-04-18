import { expect, it } from 'vitest';
import {
	generateStaticManifest,
	generateVariableManifest,
} from '../container/src/manifest';
import { staticMetadata, variableAxes, variableMetadata } from './helpers';

it('generates static manifest entries', () => {
	expect(generateStaticManifest(staticMetadata)).toMatchSnapshot();
});

it('generates variable manifest entries', () => {
	expect(
		generateVariableManifest(variableMetadata, variableAxes),
	).toMatchSnapshot();
});
