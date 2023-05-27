import { Router, IRequestStrict } from 'itty-router';
import { CFRouterContext } from '@/types';

const router = Router<IRequestStrict, CFRouterContext>();

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
