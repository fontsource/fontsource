import {
	error,
	type IRequestStrict,
	json,
	Router,
	withContent,
	withParams,
} from 'itty-router';

import { verifyAuth } from './auth';
import { type CFRouterContext } from './types';

interface MultipartContent {
	uploadId?: string;
	parts?: R2UploadedPart[];
}

interface DownloadRequest extends IRequestStrict {
	path: string;
	prefix: string;
	content: MultipartContent;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get(
	'/list/:prefix+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { prefix } = request;
		if (!prefix) return error(400, 'Bad Request. Prefix is required.');

		const list = await env.BUCKET.list({ prefix });
		const objects = list.objects.map((object) => object.key);

		return json({ status: 200, objects }, { status: 200 });
	},
);

router.get(
	'/get/:path+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path } = request;
		if (!path) return error(400, 'Bad Request. Path is required.');

		const object = await env.BUCKET.get(path);
		if (!object) {
			return error(404, `Not Found. Object ${path} does not exist.`);
		}

		return new Response(await object.arrayBuffer(), {
			status: 200,
		});
	},
);

router.post(
	'/multipart/:path+',
	withParams,
	withContent,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path, query, content } = request;
		if (!path) return error(400, 'Bad Request. Path is required.');

		const action = query.action;
		if (!action) return error(400, 'Bad Request. Action is required.');

		switch (action) {
			case 'mpu-create': {
				const multipartUpload = await env.BUCKET.createMultipartUpload(path);
				const body = {
					uploadId: multipartUpload.uploadId,
				};

				return json({ status: 200, body }, { status: 200 });
			}
			case 'mpu-complete': {
				const { uploadId, parts } = content;
				if (!uploadId) return error(400, 'Bad Request. Upload ID is required.');
				if (!parts) return error(400, 'Bad Request. Parts are required.');

				const multipartUpload = env.BUCKET.resumeMultipartUpload(
					path,
					uploadId,
				);

				// Error handling in case the multipart upload does not exist anymore
				try {
					const object = await multipartUpload.complete(parts);
					return new Response(undefined, {
						headers: {
							etag: object.httpEtag,
						},
					});
				} catch (error: any) {
					return error(400, error.message);
				}
			}
			default: {
				return error(400, 'Bad Request. Invalid action.');
			}
		}
	},
);

router.put(
	'/multipart/:path+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path, query } = request;
		if (!path) return error(400, 'Bad Request. Path is required.');

		const action = query.action;
		if (!action) return error(400, 'Bad Request. Action is required.');

		switch (action) {
			case 'mpu-uploadpart': {
				// Parse form data body
				const formData = await request.formData();
				const partNumber = formData.get('partNumber');
				if (!partNumber)
					return error(400, 'Bad Request. Part number is required.');

				const uploadId = formData.get('uploadId');
				if (!uploadId) return error(400, 'Bad Request. Upload ID is required.');

				const file = formData.get('file');
				if (!file) return error(400, 'Bad Request. File is required.');

				const multipartUpload = env.BUCKET.resumeMultipartUpload(
					path,
					uploadId,
				);

				// Error handling in case the multipart upload does not exist anymore
				try {
					const uploadedPart: R2UploadedPart = await multipartUpload.uploadPart(
						Number(partNumber),
						file,
					);
					const resp = {
						ETag: uploadedPart.etag,
					};

					return json({ status: 200, resp }, { status: 200 });
				} catch (error: any) {
					return error(400, error.message);
				}
			}
			default: {
				return error(400, 'Bad Request. Invalid action.');
			}
		}
	},
);

router.delete(
	'/multipart/:path+',
	withParams,
	withContent,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path, content, query } = request;
		if (!path) return error(400, 'Bad Request. Path is required.');

		const action = query.action;
		if (!action) return error(400, 'Bad Request. Action is required.');

		switch (action) {
			case 'mpu-abort': {
				const { uploadId } = content;
				if (!uploadId) return error(400, 'Bad Request. Upload ID is required.');

				const multipartUpload = env.BUCKET.resumeMultipartUpload(
					path,
					uploadId,
				);

				// Error handling in case the multipart upload does not exist anymore
				try {
					await multipartUpload.abort();
					return json({ status: 200 }, { status: 200 });
				} catch (error: any) {
					return error(400, error.message);
				}
			}
			default: {
				return error(400, 'Bad Request. Invalid action.');
			}
		}
	},
);

router.put(
	'/put/:path+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path } = request;
		if (!path) return error(400, 'Bad Request. Path is required.');

		const body = await request.arrayBuffer();

		await env.BUCKET.put(path, body);
		return json({ status: 200, message: 'Success' }, { status: 200 });
	},
);

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
