import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import invariant from 'tiny-invariant';

const ensurePrimary = async () => {
	if (process.env.FLY) {
		const { primaryInstance, currentIsPrimary } = await getInstanceInfo();

		if (!currentIsPrimary) {
			throw await getFlyReplayResponse(primaryInstance);
		}
	}
};

const getInstanceInfo = async () => {
	const currentInstance = os.hostname();
	let primaryInstance;
	const { LITEFS_DIR, FLY } = process.env;
	if (FLY) {
		invariant(LITEFS_DIR, 'FLY_LITEFS_DIR is not defined');
		try {
			primaryInstance = await fs.readFile(
				path.join(LITEFS_DIR, '.primary'),
				'utf8'
			);
			primaryInstance = primaryInstance.trim();
		} catch {
			primaryInstance = currentInstance;
		}
	}

	return {
		primaryInstance,
		currentInstance,
		currentIsPrimary: currentInstance === primaryInstance,
	};
};

// LiteFS only lets db writes happen to the primary instance
// Thus we need to replay the request to the new region
const getFlyReplayResponse = async (instance?: string) => {
	// eslint-disable-next-line unicorn/no-await-expression-member
	const instanceVal = instance ?? (await getInstanceInfo()).primaryInstance;
	if (!instanceVal) throw new Error('No fly replay instance value');

	return new Response('Fly Replay', {
		status: 409,
		headers: {
			'fly-replay': `instance=${instanceVal}`,
		},
	});
};

export { ensurePrimary, getFlyReplayResponse, getInstanceInfo };
