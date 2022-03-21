module.exports = {
  '{src,apps,libs,test}/**/*.ts': [`eslint --fix`],
  '*.{ts,css,md,json}': [`prettier --write`],
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
}