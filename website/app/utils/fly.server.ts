import fs from 'fs';
import os from 'os';
import path from 'path';
import invariant from 'tiny-invariant';

const ensurePrimary = async () => {
  const { currentInstance, primaryInstance, currentIsPrimary } =
    await getInstanceInfo();
  
  if (process.env.FLY && !currentIsPrimary) {
    console.log(
      `Instance (${currentInstance}) in ${process.env.FLY_REGION} is not primary (primary is: ${primaryInstance}), sending fly replay response`
    );
    throw await getFlyReplayResponse(primaryInstance);
  }
};

const getInstanceInfo = async () => {
  const currentInstance = os.hostname();
  let primaryInstance;
  const { FLY_LITEFS_DIR, FLY } = process.env;
  if (FLY) {
    invariant(FLY_LITEFS_DIR, 'FLY_LITEFS_DIR is not defined');
    try {
      primaryInstance = await fs.promises.readFile(
        path.join(FLY_LITEFS_DIR, '.primary'),
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
