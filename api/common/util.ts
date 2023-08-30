import { StatusError } from 'itty-router'

interface Tag {
	id: string;
	version: string;
}

export const splitTag = (tag: string): Tag => {
// Parse tag for version e.g roboto@1.1.1
	const tagSplit = tag.split('@');
	const version = tagSplit[1];
	if (version.split('.').length !== 3) {
		throw new StatusError(400, 'Bad Request. Invalid version.');
	}

	return { id: tagSplit[0], version};
};
