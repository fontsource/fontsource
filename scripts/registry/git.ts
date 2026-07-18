import { execFileSync } from 'node:child_process';
import { compareStrings } from './shared.ts';

const MAX_GIT_OUTPUT = 512 * 1024 * 1024;

const runGit = (repository: string, args: string[]): Buffer =>
	execFileSync('git', ['-C', repository, ...args], {
		maxBuffer: MAX_GIT_OUTPUT,
		stdio: ['ignore', 'pipe', 'pipe'],
	});

export type GitTree = {
	revision: string;
	paths: readonly string[];
	read: (path: string) => Buffer;
};

export type GitSnapshot = GitTree & {
	lastChanged: (path: string) => { revision: string; date: string };
};

export const openGitTree = (repository: string, revision: string): GitTree => {
	if (!/^[0-9a-f]{40}$/.test(revision)) {
		throw new Error('Revision must be a full lowercase 40-character commit');
	}
	const resolved = runGit(repository, [
		'rev-parse',
		'--verify',
		`${revision}^{commit}`,
	])
		.toString('utf8')
		.trim();
	if (resolved !== revision) {
		throw new Error(`Revision ${revision} did not resolve exactly`);
	}

	const paths = runGit(repository, ['ls-tree', '-r', '--name-only', revision])
		.toString('utf8')
		.trim()
		.split('\n')
		.filter(Boolean)
		.sort(compareStrings);

	return {
		revision,
		paths,
		read: (path) => runGit(repository, ['show', `${revision}:${path}`]),
	};
};

/** Open one immutable Git tree with the history required for provenance. */
export const openGitSnapshot = (
	repository: string,
	revision: string,
): GitSnapshot => {
	const tree = openGitTree(repository, revision);
	const shallow = runGit(repository, ['rev-parse', '--is-shallow-repository'])
		.toString('utf8')
		.trim();
	if (shallow !== 'false') {
		throw new Error('Registry generation requires complete Git history');
	}

	return {
		...tree,
		lastChanged: (path) => {
			const [changedRevision, date] = runGit(repository, [
				'log',
				'-1',
				'--format=%H%x00%cs',
				tree.revision,
				'--',
				path,
			])
				.toString('utf8')
				.trim()
				.split('\0');
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
