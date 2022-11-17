import invariant from 'tiny-invariant';

import { addCss } from './css.server';
import { knex } from './db.server';
import { ensurePrimary } from './fly.server';
import type {
  DownloadMetadata,
  FontList,
  PackageJson,
  UnicodeData,
} from './types';

const getFontList = async () => {
  return (
    await fetch(
      'https://raw.githubusercontent.com/fontsource/fontsource/main/FONTLIST.json'
    )
  ).json() as Promise<FontList>;
};

const fetchMetadata = async (id: string) => {
  // We can only write to DB in primary instance
  await ensurePrimary();

  const BASE_URL = 'https://cdn.jsdelivr.net/npm';
  const METADATA_URL = `${BASE_URL}/@fontsource/${id}/metadata.json`;
  const UNICODE_URL = `${BASE_URL}/@fontsource/${id}/unicode.json`;
  const PACKAGE_URL = `${BASE_URL}/@fontsource/${id}/package.json`;

  const metadata: DownloadMetadata = await fetch(METADATA_URL).then((res) =>
    res.json()
  );
  invariant(metadata, `Could not fetch metadata for ${id}`);

  const unicode: UnicodeData = await fetch(UNICODE_URL).then((res) =>
    res.json()
  );
  invariant(unicode, `Could not fetch unicode data for ${id}`);

  const packageJson: PackageJson = await fetch(PACKAGE_URL).then((res) =>
    res.json()
  );
  invariant(packageJson, `Could not fetch package.json for ${id}`);

  // Save metadata to DB
  await knex('fonts')
    .insert({
      id: metadata.fontId,
      family: metadata.fontName,
      subsets: metadata.subsets.join(','),
      weights: metadata.weights.join(','),
      styles: metadata.styles.join(','),
      defSubset: metadata.defSubset,
      variable: metadata.variable ? 1 : 0,
      lastModified: metadata.lastModified,
      version: metadata.version,
      npmVersion: packageJson.version,
      category: metadata.category,
      source: metadata.source,
      license: metadata.license,
      type: metadata.type,
    })
    .onConflict('id')
    .merge();

  await knex('unicode')
    .insert({
      id: metadata.fontId,
      data: JSON.stringify(unicode),
    })
    .onConflict('id')
    .merge();

  if (metadata.variable) {
    await knex('variable')
      .insert({
        id: metadata.fontId,
        axes: JSON.stringify(metadata.variable),
      })
      .onConflict('id')
      .merge();
  }

  await addCss(metadata);

};

const getMetadata = async (id: string) => {
  // Check if metadata already exists in DB
  let metadata = await knex('fonts').where({ id }).first();
  if (!metadata) {
    await fetchMetadata(id);
    metadata = await knex('fonts').where({ id }).first();
  }

  // Convert metadata from DB to JSON friendly
  metadata.subsets = metadata.subsets.split(',');
  metadata.weights = metadata.weights.split(',').map((w: string) => Number(w));
  metadata.styles = metadata.styles.split(',');
  metadata.variable = Boolean(metadata.variable);

  return metadata;
};

export { fetchMetadata, getFontList, getMetadata };
