import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node'
import { useLoaderData,useParams } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { getMetadata } from '@/utils/metadata.server';

export const loader: LoaderFunction = async ({ params }) => {
    const { id } = params;
    invariant(id, 'Missing font ID!');
    const metadata = await getMetadata(id);

    return json(metadata);
}

export default function Font() {
    const params = useParams();
    const metadata = useLoaderData();
    const id = params.id;
    
    return (
        <div>{id} {metadata.family}</div>
    )
}