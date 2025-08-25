import { useLocation } from 'react-router';

import { Footer } from './Footer';
import { Header } from './Header';

interface AppShellProps {
	children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
	const isNotHome = useLocation().pathname !== '/';

	return (
		<>
			<Header />
			<main>{children}</main>
			{isNotHome && <Footer style={{ marginTop: 'auto' }} />}
		</>
	);
};
