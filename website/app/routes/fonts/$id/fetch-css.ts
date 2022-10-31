import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

// Resource route to fetch CSS for font
const baseUrl = "https://cdn.jsdelivr.net/npm";
const cssUrl = (fontId: string) => `${baseUrl}/@fontsource/${fontId}/index.css`;

export const loader: LoaderFunction = async ({ params }) => {
  const rawCss = await fetch(cssUrl(params.id as string)).then(res =>
    res.text()
  );

  const cssRewrite = rawCss.replace(
    /url\('\.\/(files\/.*?)'\)/g,
    // match "url('./files/${woffFileName}')", then replace with "url('${baseURL}/files/${woffFileName}')"
    `url('${baseUrl}/@fontsource/${params.id}/$1')`
  );

  const minifiedCss = cssRewrite
    // remove comments, newlines, and tabs
    .replace(/\/\*[\s\S]*?\*\/|[\r\n\t]+/g, "")
    // limit number of adjacent spaces to 1
    .replace(/ {2,}/g, " ")
    // remove spaces around the following: ,:;{}
    .replace(/ ?([,:;{}]) ?/g, "$1")
    // remove last semicolon in block
    .replace(/;}/g, "}");

  return json({ css: minifiedCss });
};
