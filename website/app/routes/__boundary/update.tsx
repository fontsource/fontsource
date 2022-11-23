import type { ActionFunction } from '@remix-run/node';
import invariant from 'tiny-invariant';

import { ensurePrimary } from '@/utils/fly.server';
import { fetchMetadata,getFontList } from '@/utils/metadata.server';

interface UpdateData {
    token: string;
    fonts: boolean | string[];
}

export const action: ActionFunction = async ({ request }) => {
    await ensurePrimary();
    
    const data: UpdateData = await request.json();
    invariant(data, 'No data was sent with the request');
    invariant(data.fonts, 'No fonts were sent with the request');
    invariant(data.token, 'No update token was sent with the request');

    if (data.token !== process.env.UPDATE_TOKEN) {
        return new Response('Invalid update token', { status: 401 });
    }

    const list = await getFontList();

    let updateList: string[] = [];
    if (Array.isArray(data.fonts)) {
        // Verify that the fonts sent are valid
        for (const id of data.fonts) {
            invariant(Object.keys(list).includes(id), `Font ${id} does not exist`);
        }

        updateList = data.fonts;
    } else {
        updateList = Object.keys(list);
    }

    for (const id of updateList) {
        console.log(`Updating ${id}`);
        await fetchMetadata(id);
    }
}