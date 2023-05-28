import fontsourceMetadata from './fixtures/fontsource.json';

export const mockMetadata = () => {
	const fetchMock = getMiniflareFetchMock();
	// Throw when no matching mocked request is found
	fetchMock.disableNetConnect();

	// Handlers
	// We want this to be the default response for all requests
	const origin = fetchMock.get('https://raw.githubusercontent.com');
	origin
		.intercept({
			method: 'GET',
			path: '/fontsource/font-files/main/metadata/fontsource.json',
		})
		.reply(200, JSON.stringify(fontsourceMetadata));
};
