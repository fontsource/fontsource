import {
	error as routerError,
	type IRequestStrict,
	json,
	Router,
	StatusError,
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
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get(
	'/list/:prefix+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { prefix } = request;
		if (!prefix) throw new StatusError(400, 'Bad Request. Prefix is required.');

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
		if (!path) throw new StatusError(400, 'Bad Request. Path is required.');

		const object = await env.BUCKET.get(path);
		if (!object)
			throw new StatusError(404, `Not Found. Object ${path} does not exist.`);

		const headers = new Headers();
		headers.set('etag', object.httpEtag);

		return new Response(object.body, {
			headers,
			status: 200,
		});
	},
);

router.post(
	'/multipart/:path+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path, query } = request;
		if (!path) throw new StatusError(400, 'Bad Request. Path is required.');

		const action = query.action;
		if (!action) throw new StatusError(400, 'Bad Request. Action is required.');

		switch (action) {
			case 'mpu-create': {
				const multipartUpload = await env.BUCKET.createMultipartUpload(path);
				return json(
					{ status: 200, uploadId: multipartUpload.uploadId },
					{ status: 200 },
				);
			}
			case 'mpu-complete': {
				const data = await request.json<MultipartContent>();
				const uploadId = data.uploadId;
				if (!uploadId)
					throw new StatusError(400, 'Bad Request. Upload ID is required.');
				const parts = data.parts;
				if (!parts)
					throw new StatusError(400, 'Bad Request. Parts are required.');

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
					if (error instanceof StatusError) throw error;
					throw new StatusError(
						500,
						`Internal Server Error. Failed to complete multipart upload. ${error.message}`,
					);
				}
			}
			default: {
				throw new StatusError(400, 'Bad Request. Invalid action.');
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
		if (!path) throw new StatusError(400, 'Bad Request. Path is required.');

		const action = query.action;
		if (!action) throw new StatusError(400, 'Bad Request. Action is required.');

		switch (action) {
			case 'mpu-uploadpart': {
				// Parse form data body
				const formData = await request.formData();
				const partNumber = formData.get('partNumber');
				if (!partNumber)
					throw new StatusError(400, 'Bad Request. Part number is required.');

				const uploadId = formData.get('uploadId');
				if (!uploadId)
					throw new StatusError(400, 'Bad Request. Upload ID is required.');

				const file = formData.get('file') as unknown as Blob | undefined;
				if (!file) throw new StatusError(400, 'Bad Request. File is required.');
				const fileBuffer = await file.arrayBuffer();

				const multipartUpload = env.BUCKET.resumeMultipartUpload(
					path,
					uploadId,
				);

				// Error handling in case the multipart upload does not exist anymore
				try {
					const uploadedPart: R2UploadedPart = await multipartUpload.uploadPart(
						Number(partNumber),
						new Uint8Array(fileBuffer),
					);

					return json(
						{ status: 201, etag: uploadedPart.etag },
						{ status: 201 },
					);
				} catch (error: any) {
					if (error instanceof StatusError) throw error;
					throw new StatusError(
						500,
						`Internal Server Error. Failed to upload part. ${error.message}`,
					);
				}
			}
			default: {
				throw new StatusError(400, 'Bad Request. Invalid action.');
			}
		}
	},
);

router.delete(
	'/multipart/:path+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path, query } = request;
		if (!path) throw new StatusError(400, 'Bad Request. Path is required.');

		const action = query.action;
		if (!action) throw new StatusError(400, 'Bad Request. Action is required.');

		switch (action) {
			case 'mpu-abort': {
				const data = await request.json<MultipartContent>();
				const uploadId = data.uploadId;
				if (!uploadId)
					throw new StatusError(400, 'Bad Request. Upload ID is required.');

				const multipartUpload = env.BUCKET.resumeMultipartUpload(
					path,
					uploadId,
				);

				// Error handling in case the multipart upload does not exist anymore
				try {
					await multipartUpload.abort();
					console.log(`Aborted multipart upload for ${path}.`);
					return json({ status: 200 }, { status: 200 });
				} catch (error: any) {
					throw new StatusError(
						500,
						`Internal Server Error. Failed to abort multipart upload. ${error.message}`,
					);
				}
			}
			default: {
				throw new StatusError(400, 'Bad Request. Invalid action.');
			}
		}
	},
);

router.put(
	'/put/:path+',
	withParams,
	verifyAuth,
	async (request, env, _ctx) => {
		const { path, body } = request;
		if (!path) throw new StatusError(400, 'Bad Request. Path is required.');

		await env.BUCKET.put(path, body);
		return json({ status: 201, message: 'Success.' }, { status: 201 });
	},
);

// 404 for everything else
router.all('*', () =>
	routerError(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
