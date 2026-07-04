import type { LoaderFunction } from 'react-router';
import { Outlet } from 'react-router';

import { CommandBar } from '@/components/docs/CommandBar';
import classes from '@/components/docs/Layout.module.css';
import { LeftSidebar } from '@/components/docs/LeftSidebar';
import { getSerializedPageTree } from '@/utils/docs/source.server';

export const loader: LoaderFunction = async () => {
	return {
		pageTree: await getSerializedPageTree(),
	};
};

export default function Docs() {
	return (
		<>
			<CommandBar />
			<div className={classes.shell}>
				<aside className={classes.sidebar}>
					<LeftSidebar />
				</aside>
				<div className={classes.content}>
					<Outlet />
				</div>
			</div>
		</>
	);
}
