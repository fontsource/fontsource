import { CFRouterContext } from '@/types';
import { IRequestStrict, Router } from 'itty-router';

const router = Router<IRequestStrict, CFRouterContext>();

const listPlaceholder = {
	abel: 'google',
	'material-icons': 'icons',
	yakuhanjp: 'other',
};

const listPlaceholderDate = {
	abel: '2021-01-01',
	'material-icons': '2021-01-01',
	yakuhanjp: '2021-01-01',
};

router.get('/fontlist', async (request, env, ctx) => {
	const url = new URL(request.url);

	// If there is a query string ?date, return listPlaceholderDate else return listPlaceholder
	const date = url.searchParams.get('date');
	const list = date ? listPlaceholderDate : listPlaceholder;

	return new Response(JSON.stringify(list), {
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
	});
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
