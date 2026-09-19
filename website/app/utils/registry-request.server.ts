const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const getResponseStatus = (error: unknown): number | undefined => {
	if (error instanceof Response) return error.status;
	if (!isRecord(error)) return;
	if (typeof error.status === 'number') return error.status;

	const data = error.data;
	if (isRecord(data) && typeof data.status === 'number') return data.status;

	const init = error.init;
	if (typeof init === 'number') return init;
	if (isRecord(init) && typeof init.status === 'number') return init.status;
};

const isAbortError = (error: unknown) =>
	isRecord(error) && error.name === 'AbortError';

const loadOptionalRegistryData = async <T>(
	request: Promise<T>,
	signal?: AbortSignal,
	resource = 'Optional font data',
): Promise<T | undefined> => {
	try {
		return await request;
	} catch (error) {
		if (signal?.aborted || isAbortError(error)) throw error;
		if (getResponseStatus(error) === 404) return undefined;
		throw new Response(`${resource} is temporarily unavailable.`, {
			status: 503,
			statusText: 'Service Unavailable',
		});
	}
};

const loadRequiredRegistryData = async <T>(
	request: Promise<T>,
	signal?: AbortSignal,
	resource = 'Font data',
): Promise<T> => {
	try {
		return await request;
	} catch (error) {
		if (signal?.aborted || isAbortError(error)) throw error;
		const status = getResponseStatus(error);
		if (status === 404) {
			throw new Response(`${resource} was not found.`, {
				status: 404,
				statusText: 'Not Found',
			});
		}
		throw new Response(`${resource} is temporarily unavailable.`, {
			status: 503,
			statusText: 'Service Unavailable',
		});
	}
};

export { loadOptionalRegistryData, loadRequiredRegistryData };
