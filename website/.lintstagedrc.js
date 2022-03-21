module.exports = {
  '*.{js,jsx,ts,tsx}': [`eslint --fix`],
  '*.{js,jsx,ts,tsx,css,md,json}': [`prettier --write`],
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
}