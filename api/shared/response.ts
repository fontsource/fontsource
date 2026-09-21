type ResponseBody = BodyInit | Uint8Array<ArrayBufferLike>;

export const toResponseBody = (body: ResponseBody): BodyInit => {
	if (!(body instanceof Uint8Array)) return body;

	if (
		body.buffer instanceof ArrayBuffer &&
		body.byteOffset === 0 &&
		body.byteLength === body.buffer.byteLength
	) {
		return body.buffer;
	}

	return new Uint8Array(body).buffer;
};
