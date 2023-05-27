import { Router, IRequest } from 'itty-router';
import { CFRouterContext } from '@/types';

const router = Router<IRequest, CFRouterContext>();

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
