import { cors, error, Router } from 'itty-router';

import downloadRouter from './download/router';
import fontlistRouter from './fontlist/router';
import fontsRouter from './fonts/router';
import statsRouter from './stats/router';
import variableRouter from './variable/router';

export const { preflight, corsify } = cors();

export const router = Router();

router.all('*', preflight);

router.get('/fontlist', fontlistRouter.fetch);
router.get('/v1/fonts/*?', fontsRouter.fetch);
router.get('/v1/download/*?', downloadRouter.fetch);
router.get('/v1/variable/*?', variableRouter.fetch);
router.get('/v1/axis-registry', variableRouter.fetch);
router.get('/v1/stats/*?', statsRouter.fetch);
router.get('/v1/version/*?', statsRouter.fetch);

router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);
