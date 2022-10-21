import fs from 'fs-extra';
import * as path from 'pathe';

// Return file names
const readDir = (dirPath: string, extension: string): string[] => {
	const fileArr: string[] = [];
	for (const file of fs.readdirSync(dirPath)) {
		const fileExtension = file.split('.')[1];
		if (extension === fileExtension) {
			fileArr.push(file);
		}
	}

	return fileArr;
};

// Return string of all contentss
const readDirContents = (dirPath: string, fileNames: string[]): string[] => {
	const fileContents: string[] = [];

	for (const file of fileNames) {
		const content = fs
			.readFileSync(path.join(dirPath, file))
			.toString()
			// Remove whitespace due to possible diffs
			.replace(/\s/g, '');
		fileContents.push(content);
	}
	return fileContents;
};

export { readDir, readDirContents };
