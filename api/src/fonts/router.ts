import { Router } from 'itty-router';

const router = Router();

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
