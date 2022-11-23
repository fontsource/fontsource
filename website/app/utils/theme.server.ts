import { createCookieSessionStorage } from '@remix-run/node';

const themes = ['light', 'dark'] as const;
type Theme = typeof themes[number];
const isTheme = (value: string): value is Theme =>
	themes.includes(value as Theme);

const themeStorage = createCookieSessionStorage({
	cookie: {
		name: 'theme',
		secure: true,
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: [process.env.COOKIE_SECRET!],
		maxAge: 60 * 60 * 24 * 365,
	},
});

const getThemeSession = async (request: Request) => {
	const session = await themeStorage.getSession(request.headers.get('Cookie'));
	return {
		getTheme: () => {
			const themeValue = session.get('theme');
			return isTheme(themeValue) ? themeValue : null;
		},
		setTheme: (theme: Theme) => session.set('theme', theme),
		commit: () => themeStorage.commitSession(session),
	};
};

export { getThemeSession, isTheme };
export type { Theme };
