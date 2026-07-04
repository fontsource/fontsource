import { useLocation } from 'react-router';
import classes from './AppShell.module.css';
import { Footer } from './Footer';
import { Header } from './Header';

interface AppShellProps {
	children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
	const isNotHome = useLocation().pathname !== '/';

	return (
		<>
			<a className={classes.skipLink} href="#main-content">
				Skip to content
			</a>
			<Header />
			<main id="main-content" tabIndex={-1}>
				{children}
			</main>
			{isNotHome && <Footer style={{ marginTop: 'auto' }} />}
		</>
	);
};
