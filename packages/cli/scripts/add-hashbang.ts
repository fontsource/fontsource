import * as fs from 'node:fs';

import MagicString from 'magic-string';
import { join } from 'pathe';

// Until pkgroll fixes the shebang bug, this needs to be run postbuild

const addHashbang = (filepath: string) => {
	const path = join(process.cwd(), filepath);
	const s = new MagicString(fs.readFileSync(path, 'utf8'));

	// Only add the hashbang if it's not already there
	if (!s.toString().startsWith('#!')) {
		s.prepend('#!/usr/bin/env node\n');
		fs.writeFileSync(path, s.toString());
	}
};

addHashbang('dist/cli.mjs');
