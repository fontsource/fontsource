import { createCors, error, Router } from 'itty-router';

import downloadRouter from './download/router';
import fontlistRouter from './fontlist/router';
import fontsRouter from './fonts/router';

export const { preflight, corsify } = createCors();

export const router = Router();

router.all('*', preflight);

router.get('/fontlist', fontlistRouter.handle);
router.get('/v1/fonts/*?', fontsRouter.handle);
router.get('/v1/download/*?', downloadRouter.handle);

router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);
