import type { LoaderFunctionArgs } from 'react-router';

import { handleAuthRequest } from '@/utils/auth.server';
import { cloudflareContext } from '@/utils/cloudflare-context';

export const loader = ({ request, context }: LoaderFunctionArgs) =>
	handleAuthRequest(request, context.get(cloudflareContext).env);

export const action = loader;
