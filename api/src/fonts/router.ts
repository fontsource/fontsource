import { Router, IRequestStrict } from 'itty-router';
import { CFRouterContext } from '../types';
import { getFonts } from './root';

const router = Router<IRequestStrict, CFRouterContext>();

router.get('/v1/fonts', async (request, env, _ctx) => {
	const url = new URL(request.url);
	return getFonts(url, env);
});

router.get('/v1/fonts/:font', async (request, env, ctx) => {
	const url = new URL(request.url);
	const id = request.params.font;

	return new Response(
		`Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api`,
		{ status: 404 }
	);
});

// 404 for everything else
router.all(
	'*',
	() =>
		new Response(
			`Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api`,
			{ status: 404 }
		)
);

export default router;
