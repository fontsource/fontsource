import { execFileSync } from 'node:child_process';
import { compareStrings } from './shared.ts';

const MAX_GIT_OUTPUT = 512 * 1024 * 1024;

const runGitBuffer = (repository: string, args: string[]): Buffer =>
	execFileSync('git', ['-C', repository, ...args], {
		maxBuffer: MAX_GIT_OUTPUT,
		stdio: ['ignore', 'pipe', 'pipe'],
	});

const runGitText = (repository: string, args: string[]): string =>
	runGitBuffer(repository, args).toString('utf8').trim();

export type GitSnapshot = {
	revision: string;
	paths: readonly string[];
	read(path: string): Buffer;
	lastChanged(path: string): { revision: string; date: string };
};

/** Open one immutable Git tree with the history required for provenance. */
export const openGitSnapshot = (
	repository: string,
	revision: string,
): GitSnapshot => {
	if (!/^[0-9a-f]{40}$/.test(revision)) {
		throw new Error('Revision must be a full lowercase 40-character commit');
	}
	const resolved = runGitText(repository, [
		'rev-parse',
		'--verify',
		`${revision}^{commit}`,
	]);
	if (resolved !== revision) {
		throw new Error(`Revision ${revision} did not resolve exactly`);
	}
	const shallow = runGitText(repository, [
		'rev-parse',
		'--is-shallow-repository',
	]);
	if (shallow !== 'false') {
		throw new Error('Registry generation requires complete Git history');
	}

	const paths = runGitText(repository, [
		'ls-tree',
		'-r',
		'--name-only',
		revision,
	])
		.split('\n')
		.filter(Boolean)
		.toSorted(compareStrings);

	return {
		revision,
		paths,
		read: (path) => runGitBuffer(repository, ['show', `${revision}:${path}`]),
		lastChanged: (path) => {
			const [changedRevision, date] = runGitText(repository, [
				'log',
				'-1',
				'--format=%H%x00%cs',
				revision,
				'--',
				path,
			]).split('\0');
			if (
				!changedRevision ||
				!date ||
				!/^[0-9a-f]{40}$/.test(changedRevision) ||
				!/^\d{4}-\d{2}-\d{2}$/.test(date)
			) {
				throw new Error(`Unable to determine the last change for ${path}`);
			}
			return { revision: changedRevision, date };
		},
	};
};
