// Have a sleep timer that kills the worker after 3 minutes
export const SLEEP_MINUTES = 3;

let sleepTimeout: NodeJS.Timeout;

export const keepAwake = (minutes: number) => {
	if (sleepTimeout) {
		clearTimeout(sleepTimeout);
	}

	// eslint-disable-next-line unicorn/no-process-exit
	sleepTimeout = setTimeout(() => process.exit(0), 1000 * 60 * minutes);
};
