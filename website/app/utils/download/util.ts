interface Tag {
	id: string;
	version: string;
}

export const splitTag = (tag: string): Tag => {
	// Parse tag for version e.g roboto@1.1.1
	const [id, version] = tag.split('@');
	if (!id) {
		throw new Response('Bad Request. Unable to parse font ID from tag.', {
			status: 400,
		});
	}
	if (!version) {
		throw new Response('Bad Request. Unable to parse version from tag.', {
			status: 400,
		});
	}
	if (version.split('.').length !== 3) {
		throw new Response('Bad Request. Invalid semver version.', { status: 400 });
	}

	return { id, version };
};
