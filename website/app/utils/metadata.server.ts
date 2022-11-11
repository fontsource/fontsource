const getMetadata = async (id: string) => {
    const BASE_URL = 'https://cdn.jsdelivr.net/npm';
    const METADATA_URL = `${BASE_URL}/@fontsource/${id}/metadata.json`;
    const UNICODE_URL = `${BASE_URL}/@fontsource/${id}/unicode.json`;
    
    return {
        metadata: await fetch(METADATA_URL).then((res) => res.json()),
        unicode: await fetch(UNICODE_URL).then((res) => res.json()),
    }
}

export { getMetadata };