export const fetchApiData = async <T>(url: string): Promise<T> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Response(`Failed to fetch data from ${url}`, {
			status: response.status,
			statusText: response.statusText,
		});
	}

	return response.json() as T;
};
