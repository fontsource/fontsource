import { StatusError } from 'itty-router';

export const verifyAuth = (request: Request, env: Env) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader) {
		throw new StatusError(401, 'Unauthorized. Missing authorization header.');
	}
	const [scheme, encoded] = authHeader.split(' ');

	// The Authorization header must start with Bearer, followed by a space.
	if (!encoded || scheme !== 'Bearer') {
		throw new StatusError(400, 'Bad Request. Malformed authorization header.');
	}

	if (encoded !== env.UPLOAD_KEY) {
		throw new StatusError(401, 'Unauthorized. Invalid authorization token.');
	}
};
