import { Router, IRequestStrict } from 'itty-router';
import { CFRouterContext } from '../types';

const router = Router<IRequestStrict, CFRouterContext>();

router.get('/fonts', async (request, env, ctx) => {
	const url = new URL(request.url);

	return new Response(
		`Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api`,
		{ status: 404 }
	);
});

router.get('/fonts/:font', async (request, env, ctx) => {
	const url = new URL(request.url);

	return new Response(
		`Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api`,
		{ status: 404 }
	);
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
