import { type Manifest } from './types';

type BucketPath = Pick<
	Manifest,
	'id' | 'subset' | 'weight' | 'style' | 'extension' | 'version'
>;

export const bucketPath = ({
	id,
	subset,
	weight,
	style,
	extension,
	version,
}: BucketPath) => `${id}@${version}/${subset}-${weight}-${style}.${extension}`;
