import { knex } from './db.server';
import { ensurePrimaryInstance } from './fly.server';

interface DownloadMetadata {
  fontId: string;
  fontName: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  defSubset: string;
  variable: boolean;
  lastModified: string;
  version: string;
  category: string;
  source: string;
  license: string;
  type: string;
}

const fetchMetadata = async (id: string) => {
  // We can only write to DB in primary instance
  ensurePrimaryInstance();

  const BASE_URL = 'https://cdn.jsdelivr.net/npm';
  const METADATA_URL = `${BASE_URL}/@fontsource/${id}/metadata.json`;
  const data: DownloadMetadata = await fetch(METADATA_URL).then((res) =>
    res.json()
  );
  if (!data) return undefined;

  // Save metadata to DB
  await knex('fonts')
    .insert({
      id: data.fontId,
      family: data.fontName,
      subsets: data.subsets.join(','),
      weights: data.weights.join(','),
      styles: data.styles.join(','),
      defSubset: data.defSubset,
      variable: Boolean(data.variable),
      lastModified: data.lastModified,
      version: data.version,
      category: data.category,
      source: data.source,
      license: data.license,
      type: data.type,
    })
    .onConflict('id')
    .merge();

  return data;
};

const getMetadata = async (id: string) => {
  // Check if metadata already exists in DB
  let metadata = await knex('fonts').where({ id }).first();
  if (!metadata) {
    metadata = await fetchMetadata(id);
    // Rewrite objects to match DB schema
    metadata.id = metadata.fontId;
    delete metadata.fontId;
    metadata.family = metadata.fontName;
    delete metadata.fontName;
  } else {
    // Convert metadata from DB to JSON friendly
    metadata.subsets = metadata.subsets.split(',');
    metadata.weights = metadata.weights
      .split(',')
      .map((w: string) => Number(w));
    metadata.styles = metadata.styles.split(',');
    metadata.variable = Boolean(metadata.variable);
  }

  return metadata;
};

export { getMetadata };
