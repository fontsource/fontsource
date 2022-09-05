import { createCookie } from '@remix-run/node'

export let colorSchemeCookie = createCookie('color-scheme')

export const getColorSchemeToken = async (request: Request) =>
	colorSchemeCookie.parse(request.headers.get('Cookie'))

export const getColorScheme = async (request: Request) => {
	const userSelectedColorScheme = await getColorSchemeToken(request)
	const systemPreferredColorScheme = request.headers.get(
		'Sec-CH-Prefers-Color-Scheme'
	)

	return userSelectedColorScheme ?? systemPreferredColorScheme
}