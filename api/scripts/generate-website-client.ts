import { createClient } from '@hey-api/openapi-ts';

import { openapi } from '../worker/src/app';

await createClient({
	input: openapi.schema,
	output: {
		path: '../website/app/generated/api',
		tsConfigPath: '../website/tsconfig.json',
	},
	plugins: [
		'@hey-api/typescript',
		{
			name: '@hey-api/client-fetch',
			runtimeConfigPath: '../website/app/utils/api.server',
			throwOnError: true,
		},
		{
			name: '@hey-api/sdk',
			paramsStructure: 'flat',
			responseStyle: 'data',
		},
	],
});
