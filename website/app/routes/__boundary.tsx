import { Container } from '@mantine/core';
import { Outlet, useCatch } from '@remix-run/react';

// Workaround for styles not loading on boundaries - https://github.com/remix-run/remix/issues/1136
export default function Boundary() {
	return <Outlet />;
}

export function CatchBoundary() {
	const caught = useCatch();

	if (caught.status === 404) {
		return (
			<Container>
				<p>404 Font Not Found</p>
			</Container>
		);
	}

	throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);
	return (
		<Container>
			<p>[ErrorBoundary]: There was an error: {error.message}</p>
		</Container>
	);
}
