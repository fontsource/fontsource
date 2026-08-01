import type { RegistryDataState } from '@/utils/registry';

interface RegistryRequestResult<T> {
	value?: T;
	state: RegistryDataState;
}

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
): Promise<RegistryRequestResult<T>> => {
	try {
		return { value: await request, state: 'available' };
	} catch (error) {
		if (signal?.aborted || isAbortError(error)) throw error;
		return {
			state: getResponseStatus(error) === 404 ? 'not-found' : 'unavailable',
		};
	}
};

export type { RegistryRequestResult };
export { loadOptionalRegistryData };
