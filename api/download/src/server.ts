import { enable, error as errorDiary, info } from 'diary';
import { error as errorRes, json, type StatusError } from 'itty-router';

import router from './router';

// Enable logging
enable('*');

// Have a sleep timer that kills the worker after 5 minutes
let sleepTimeout: NodeJS.Timeout;
const keepAwake = (minutes: number) => {
	if (sleepTimeout) {
		clearTimeout(sleepTimeout);
	}

	// eslint-disable-next-line unicorn/no-process-exit
	sleepTimeout = setTimeout(() => process.exit(0), 1000 * 60 * minutes);
};

export default {
	port: process.env.PORT ?? 3001,
	fetch: async (req: Request) => {
		return await router
			.handle(req)
			.then((res: Response) => {
				const path = new URL(req.url).pathname;
				info(`${req.method} ${path} ${res.status}`);
				keepAwake(5);
				return json(res);
			})
			.catch((error_: StatusError) => {
				const path = new URL(req.url).pathname;
				if (error_.status >= 500) {
					errorDiary(
						`${req.method} ${path} ${error_.status} ${error_.message}`,
					);
				} else {
					info(`${req.method} ${path} ${error_.status} ${error_.message}`);
				}

				keepAwake(5);
				return errorRes(error_);
			});
	},
};
