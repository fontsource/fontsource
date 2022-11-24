const { spawn } = require('child_process');

const deployMigrations = async () => {
	console.log('Deploying migrations...');
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

module.exports = deployMigrations;
