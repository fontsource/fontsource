import { Footer } from './Footer';
import { Header } from './Header';

interface AppShellProps {
	children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
	return (
		<div style={{
			display: 'flex',
			minHeight: '100vh',
			flexDirection: 'column',
			justifyContent: 'flex-start'
		}}>
			<Header />
			<main>{children}</main>
			<Footer style={{ marginTop: 'auto' }} />
		</div>
	);
};
