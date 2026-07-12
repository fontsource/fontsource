import { Button, Center, Flex, Stack, Text, Title } from '@mantine/core';
import {
	isRouteErrorResponse,
	Link,
	useLocation,
	useRouteError,
} from 'react-router';
import styles from './ErrorBoundary.module.css';
import { IconGithub } from './icons/Github';

export function ErrorBoundary() {
	const error = useRouteError();
	const location = useLocation();

	let status = 500;
	let title = 'Something went wrong';
	let description = 'An unexpected error occurred. Please try again.';

	if (isRouteErrorResponse(error)) {
		status = error.status;
		const responseMessage =
			typeof error.data === 'string'
				? error.data
				: error.data &&
						typeof error.data === 'object' &&
						'error' in error.data &&
						typeof error.data.error === 'string'
					? error.data.error
					: undefined;

		if (status === 404) {
			title = 'Page not found';
			description =
				responseMessage ?? "The page you're looking for doesn't exist.";
		} else if (status === 502) {
			title = 'Bad gateway';
			description =
				responseMessage ??
				'The upstream service could not complete the request. Please try again.';
		} else {
			title = 'Server error';
			description = responseMessage ?? error.statusText ?? description;
		}
	} else if (error instanceof Error) {
		description = error.message;
	}

	const canRetry = status === 502;

	return (
		<Center className={styles.container}>
			<Flex align="center" className={styles.content} direction="column">
				<Flex align="center" className={styles.errorInfo} direction="column">
					<Text className={styles.statusCode}>{status}</Text>
					<Title order={1} className={styles.title}>
						{title}
					</Title>
					<Text className={styles.description}>{description}</Text>
				</Flex>

				<Stack className={styles.actions} gap={12}>
					<Button
						component={Link}
						to={canRetry ? `${location.pathname}${location.search}` : '/'}
						reloadDocument={canRetry}
						size="md"
						fullWidth
						className={styles.primaryButton}
					>
						{canRetry ? 'Try again' : 'Go home'}
					</Button>
					<Button
						component="a"
						href="https://github.com/fontsource/fontsource/issues/new"
						variant="outline"
						size="md"
						leftSection={<IconGithub height={16} />}
						target="_blank"
						rel="noopener noreferrer"
						fullWidth
						className={styles.outlineButton}
					>
						Report issue
					</Button>
				</Stack>

				{process.env.NODE_ENV === 'development' && error instanceof Error && (
					<div className={styles.devError}>
						<Text className={styles.devErrorTitle}>Development Error</Text>
						<Text className={styles.devErrorContent}>{error.stack}</Text>
					</div>
				)}
			</Flex>
		</Center>
	);
}
