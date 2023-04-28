import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import invariant from 'tiny-invariant';

const ensurePrimary = async () => {
	const { primaryInstance, currentIsPrimary } = await getInstanceInfo();

	if (process.env.FLY && !currentIsPrimary) {
		throw await getFlyReplayResponse(primaryInstance);
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
		} catch (error: unknown) {
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
	return new Response('Fly Replay', {
		status: 409,
		headers: {
			'fly-replay': `instance=${
				instance ?? (await getInstanceInfo()).primaryInstance
			}`,
		},
	});
};

export { ensurePrimary, getFlyReplayResponse, getInstanceInfo };
