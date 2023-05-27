import { CFRouterContext } from '@/types';
import { IRequest, Router } from 'itty-router';

const router = Router<IRequest, CFRouterContext>();

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
