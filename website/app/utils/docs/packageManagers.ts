export const packageManagers = [
	{ value: 'npm', command: (cmd: string) => `npm install ${cmd}` },
	{ value: 'yarn', command: (cmd: string) => `yarn add ${cmd}` },
	{ value: 'pnpm', command: (cmd: string) => `pnpm add ${cmd}` },
	{ value: 'bun', command: (cmd: string) => `bun add ${cmd}` },
];

export const packageManagerValues = packageManagers.map(
	(manager) => manager.value,
);

export const getPackageManagerCommand = (value: string, cmd: string) =>
	(
		packageManagers.find((manager) => manager.value === value) ??
		packageManagers[0]
	).command(cmd);

export const getPackageManagerCommands = (cmd: string) =>
	packageManagers.map(({ command, value }) => ({
		value,
		command: command(cmd),
	}));

export const getPackageManagerCommandBlock = (cmd: string) =>
	getPackageManagerCommands(cmd)
		.map(({ command }) => command)
		.join('\n');
