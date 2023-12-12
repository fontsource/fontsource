import { enable, error as errorDiary, info } from 'diary';
import { error as errorRes, json, type StatusError } from 'itty-router';

import router from './router';
import { keepAwake, SLEEP_MINUTES } from './sleep';

// Enable logging
enable('*');

// Trigger the timeout on first load
keepAwake(SLEEP_MINUTES);

export default {
	port: process.env.PORT ?? 3001,
	fetch: async (req: Request) => {
		return await router
			.handle(req)
			.then((res: Response) => {
				const path = new URL(req.url).pathname;
				info(`${req.method} ${path} ${res.status}`);
				keepAwake(SLEEP_MINUTES);
				return json(res);
			})
			.catch((error_: StatusError) => {
				const path = new URL(req.url).pathname;
				if (!error_.status || error_.status >= 500) {
					errorDiary(
						`${req.method} ${path} ${error_.status} ${error_.message}`,
					);
				} else {
					info(`${req.method} ${path} ${error_.status} ${error_.message}`);
				}

				keepAwake(SLEEP_MINUTES);
				return errorRes(error_);
			});
	},
};
