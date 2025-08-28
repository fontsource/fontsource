import { Button, Stack, Text, Title } from '@mantine/core';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import styles from './ErrorBoundary.module.css';
import { IconGithub } from './icons/Github';

export function ErrorBoundary() {
	const error = useRouteError();

	let status = 500;
	let title = 'Something went wrong';
	let description = 'An unexpected error occurred. Please try again.';

	if (isRouteErrorResponse(error)) {
		status = error.status;
		title = status === 404 ? 'Page not found' : 'Server error';
		description =
			status === 404
				? "The page you're looking for doesn't exist."
				: error.statusText || description;
	} else if (error instanceof Error) {
		description = error.message;
	}

	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<div className={styles.errorInfo}>
					<Text className={styles.statusCode}>{status}</Text>
					<Title order={1} className={styles.title}>
						{title}
					</Title>
					<Text className={styles.description}>{description}</Text>
				</div>

				<Stack className={styles.actions}>
					<Button
						component={Link}
						to="/"
						size="md"
						fullWidth
						className={styles.primaryButton}
					>
						Go home
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
			</div>
		</div>
	);
}
