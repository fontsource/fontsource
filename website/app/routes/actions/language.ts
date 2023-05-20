import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

import { getPreviewText } from '@/utils/language/language.server';

export const loader: LoaderFunction = async () => {
	return redirect('/');
};

export const action: ActionFunction = async ({ request }) => {
	// Get values from request
	const data = await request.formData();
	const id = data.get('id') as string | undefined;
	const subset = data.get('subset') as string;

	// Return 400 if no id
	if (!subset) {
		return json({message: 'No subset found'}, { status: 400 });
	}

	// Get preview text
	const text = await getPreviewText(subset, id);
	return json({ text });
};
