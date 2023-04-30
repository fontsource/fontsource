import { Container, Group } from '@mantine/core';
import { Outlet } from '@remix-run/react';

import { DocsHeader } from '@/components/docs/DocsHeader';
import { LeftSidebar } from '@/components/docs/LeftSidebar';
import { mdxComponents } from '@/utils/mdx/getMdxComponent';

export default function Docs() {
	return (
		<>
			<DocsHeader />
			<Group>
				<LeftSidebar />
				<Container>
					<Outlet context={mdxComponents} />
				</Container>
			</Group>
		</>
	);
}
