import { createContext } from 'react-router';

export const cloudflareContext = createContext<{
	env: Env;
	ctx: ExecutionContext;
}>();
