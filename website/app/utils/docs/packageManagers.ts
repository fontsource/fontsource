export const packageManagers = [
	{ value: 'npm', command: (cmd: string) => `npm install ${cmd}` },
	{ value: 'yarn', command: (cmd: string) => `yarn add ${cmd}` },
	{ value: 'pnpm', command: (cmd: string) => `pnpm add ${cmd}` },
	{ value: 'bun', command: (cmd: string) => `bun add ${cmd}` },
];

export const packageManagerCommandBlock = (cmd: string) =>
	packageManagers.map(({ command }) => command(cmd)).join('\n');
