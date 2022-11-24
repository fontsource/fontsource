const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');
const invariant = require('tiny-invariant');
const path = require('path');

const deployMigrations = require('./migrations');

const getPrimaryInstanceHostname = async () => {
  try {
    const { FLY_LITEFS_DIR } = process.env;
    invariant(FLY_LITEFS_DIR, 'FLY_LITEFS_DIR is not defined');

    const primary = await fs.promises.readFile(
      path.join(FLY_LITEFS_DIR, '.primary'),
      'utf8'
    );
    console.log(`Found primary instance in .primary file: ${primary}`);
    return primary.trim();
  } catch (error) {
    if (error?.code === 'ENOENT') {
      console.log('No .primary file found.');
    } else {
      console.log('Error getting primary from .primary file:', error);
    }
    const currentInstance = os.hostname();
    console.log(
      `Using current instance (${currentInstance}) as primary (in ${process.env.FLY_REGION})`
    );
    return currentInstance;
  }
}

const startApp = async () => {
  const command = 'npm start';
  const child = spawn(command, { shell: true, stdio: 'inherit' });
  await new Promise((res, rej) => {
    child.on('exit', (code) => {
      if (code === 0) {
        res();
      } else {
        rej();
      }
    });
  });
}

const go = async () => {
  const currentInstance = os.hostname();
  const primaryInstance = await getPrimaryInstanceHostname();

  if (primaryInstance === os.hostname()) {
    console.log(
      `Instance (${currentInstance}) in ${process.env.FLY_REGION} is primary.`
    );
    await deployMigrations();
  } else {
    console.log(
      `Instance (${currentInstance}) in ${process.env.FLY_REGION} is not primary (the primary instance is ${primaryInstance}). Skipping migrations.`
    );
  }

	invariant(process.env.UPDATE_TOKEN, 'UPDATE_TOKEN is not defined');
	invariant(process.env.COOKIE_SECRET, 'COOKIE_SECRET is not defined');
	invariant(process.env.ALGOLIA_ADMIN_KEY, 'ALGOLIA_ADMIN_KEY is not defined');

  console.log('Starting app...');
  await startApp();
}

go();
