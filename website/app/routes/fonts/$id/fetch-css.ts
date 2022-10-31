import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

// Resource route to fetch CSS for font
const baseUrl = "https://cdn.jsdelivr.net/npm";
const cssUrl = (fontId: string) => `${baseUrl}/@fontsource/${fontId}/index.css`;

export const loader: LoaderFunction = async ({ params }) => {
  const rawCss = await fetch(cssUrl(params.id as string)).then(res =>
    res.text()
  );
  const css = rawCss.replace(
    /url\('\.\/(files\/.*?)'\)/g,
    // match "url('./files/${woffFileName}')", then replace with "url('${baseURL}/files/${woffFileName}')"
    `url('${baseUrl}/@fontsource/${params.id}/$1')`
    // Replace all whitespace to minify css
  ).replace(/\s/g, '');
  return json({ css });
};
