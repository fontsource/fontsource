const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');

const go = async () => {
  process.env.FLY_INSTANCE = os.hostname();

  try {
    const primary = await fs.promises.readFile('/litefs/data/.primary', 'utf8');

    process.env.PRIMARY_INSTANCE = primary.trim();
    console.log(`Found primary instance in .primary file: ${primary}`);
  } catch (error) {
    // If there is an error reading, this is the primary instance
    process.env.IS_PRIMARY_FLY_INSTANCE = 'true'; 

    if (error?.code === 'ENOENT') {
      console.log('No .primary file found.');
    } else {
      console.log('Error getting primary from .primary file:', error);
    }

    console.log(
      `Using current instance (${process.env.FLY_INSTANCE}) as primary (in ${process.env.FLY_REGION})`
    );
  }

  if (process.env.IS_PRIMARY_FLY_INSTANCE) {
    console.log(
      `Instance (${process.env.FLY_INSTANCE}) in ${process.env.FLY_REGION} is primary. Deploying migrations.`
    );

    await migrations();
  } else {
    console.log(
      `Instance (${process.env.FLY_INSTANCE}) in ${process.env.FLY_REGION} is not primary (the primary instance is ${process.env.PRIMARY_INSTANCE}). Skipping migrations.`
    );
  }

  console.log('Starting app...');
  await start();
};

const migrations = async () => {
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
};

const start = async () => {
  const command = 'npx remix-serve build';
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
};

go();
