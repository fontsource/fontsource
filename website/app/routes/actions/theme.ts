import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { getThemeSession, isTheme } from '@/utils/theme.server';

export const action: ActionFunction = async ({ request }) => {
	const themeSession = await getThemeSession(request);
	const requestText = await request.text();
	const form = new URLSearchParams(requestText);
	const theme = form.get('theme');

	if (!theme || !isTheme(theme)) {
		return json({});
	}

	themeSession.setTheme(theme);

	return json({}, { headers: { 'Set-Cookie': await themeSession.commit() } });
};
