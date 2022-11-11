// LiteFS only lets db writes happen to the primary instance
// Thus we need to replay the request to the new region
const getFlyReplayResponse = () => {
  const { PRIMARY_INSTANCE } = process.env;
  if (!PRIMARY_INSTANCE) {
    return new Response('Unknown primary instance', { status: 500 });
  }
  return new Response('Fly Replay', {
    status: 409,
    headers: { 'fly-replay': `instance=${process.env.PRIMARY_INSTANCE}` },
  });
};

const ensurePrimaryInstance = () => {
  if (!process.env.IS_PRIMARY_FLY_INSTANCE) {
    throw getFlyReplayResponse();
  }
};

const isPrimaryInstance = () => {
  return process.env.IS_PRIMARY_FLY_INSTANCE === 'true';
};

export { ensurePrimaryInstance, getFlyReplayResponse, isPrimaryInstance };
