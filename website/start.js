const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');
const invariant = require('tiny-invariant');
const path = require('path');

async function go() {
  const currentInstance = os.hostname();
  const primaryInstance = await getPrimaryInstanceHostname();

  if (primaryInstance === os.hostname()) {
    console.log(
      `Instance (${currentInstance}) in ${process.env.FLY_REGION} is primary. Deploying migrations.`
    );
    await deployMigrations();
  } else {
    console.log(
      `Instance (${currentInstance}) in ${process.env.FLY_REGION} is not primary (the primary instance is ${primaryInstance}). Skipping migrations.`
    );
  }

  console.log('Starting app...');
  await startApp();
}
go();

async function getPrimaryInstanceHostname() {
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

async function deployMigrations() {
  const command = 'npx knex migrate:latest';
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

async function startApp() {
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
