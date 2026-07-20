import { type RouteConfig, route } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';

export default [
	...(await flatRoutes()),
	route('languages/:language', './features/discovery/route.tsx', {
		id: 'discovery-language',
	}),
	route('categories/:category', './features/discovery/route.tsx', {
		id: 'discovery-category',
	}),
	route('variable-fonts', './features/discovery/route.tsx', {
		id: 'discovery-variable',
	}),
] satisfies RouteConfig;
