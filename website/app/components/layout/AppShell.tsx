import { Footer } from './Footer';
import { Header } from './Header';

interface AppShellProps {
	children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
	return (
		<>
			<Header />
			<main>{children}</main>
			<Footer style={{ marginTop: 'auto' }} />
		</>
	);
};
