import { enable, error as errorDiary, info } from 'diary';
import { error as errorRes, json, type StatusError } from 'itty-router';

import router from './router';

enable('*');

export default {
	port: 3001,
	fetch: async (req: Request) => {
		return await router
			.handle(req)
			.then((res: Response) => {
				const path = new URL(req.url).pathname;
				info(`${req.method} ${path} ${res.status}`);
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

				return errorRes(error_);
			});
	},
};
