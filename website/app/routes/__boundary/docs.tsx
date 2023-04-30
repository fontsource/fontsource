
import { Container } from '@mantine/core';
import { Outlet } from '@remix-run/react';

import { DocsHeader } from '@/components/docs/DocsHeader';

export default function Docs() {
	return (
		<>
			<DocsHeader />
			<Container>
				<Outlet />
			</Container>
		</>
	);
}
