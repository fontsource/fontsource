import { Anchor, Box, Container, Stack, Text, Title } from '@mantine/core';
import type { MetaFunction } from 'react-router';
import { ContentHeader } from '@/components/layout/ContentHeader';
import classes from '@/styles/privacy.module.css';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Privacy | Fontsource';
	const description =
		'How Fontsource approaches privacy across its website and services.';

	return ogMeta({ title, description });
};

const sections = [
	{ href: '#requests', label: 'Website, API, and CDN' },
	{ href: '#search', label: 'Search' },
	{ href: '#advertising', label: 'Advertising' },
	{ href: '#browser-storage', label: 'Browser storage' },
	{ href: '#contact', label: 'Contact' },
	{ href: '#changes', label: 'Changes' },
];

export default function PrivacyPage() {
	return (
		<>
			<ContentHeader>
				<Stack gap="sm" maw={760}>
					<Text className={classes.eyebrow}>Fontsource privacy notice</Text>
					<Title order={1} className={classes.title}>
						Privacy
					</Title>
					<Text className={classes.lede}>
						Fontsource is an{' '}
						<Anchor
							href="https://github.com/fontsource/fontsource"
							target="_blank"
							rel="noreferrer"
							className={classes.ledeLink}
						>
							open-source project
						</Anchor>{' '}
						for self-hostable fonts.
					</Text>
				</Stack>
			</ContentHeader>
			<Container className={classes.container}>
				<Box className={classes.layout}>
					<Box component="aside" className={classes.sidebar}>
						<Box className={classes.updated}>
							<Text className={classes.label}>Last updated</Text>
							<Text className={classes.date}>July 25, 2026</Text>
						</Box>

						<Box component="nav" aria-label="Privacy notice sections">
							<Text className={classes.label}>On this page</Text>
							<Box className={classes.navigation}>
								{sections.map((section) => (
									<Anchor
										key={section.href}
										href={section.href}
										className={classes.navigationLink}
									>
										{section.label}
									</Anchor>
								))}
							</Box>
						</Box>

						<Box className={classes.sidebarContact}>
							<Text className={classes.label}>Privacy questions</Text>
							<Anchor
								href="mailto:hello@ayuhito.com"
								className={classes.contactLink}
							>
								hello@ayuhito.com
							</Anchor>
						</Box>
					</Box>

					<Box component="article" className={classes.article}>
						<Box component="section" id="requests" className={classes.section}>
							<Text component="span" className={classes.sectionNumber}>
								01
							</Text>
							<Box>
								<Title order={2} className={classes.sectionTitle}>
									Website, API, and CDN requests
								</Title>
								<Box className={classes.copy}>
									<Text>
										Fontsource uses Cloudflare to deliver and protect its
										website and API, and partners with jsDelivr to provide its
										public CDN. These providers may process technical
										information needed to provide those services. You can read
										the{' '}
										<Anchor
											href="https://www.cloudflare.com/privacypolicy/"
											target="_blank"
											rel="noreferrer"
										>
											Cloudflare Privacy Policy
										</Anchor>{' '}
										and the{' '}
										<Anchor
											href="https://www.jsdelivr.com/terms/privacy-policy"
											target="_blank"
											rel="noreferrer"
										>
											jsDelivr Privacy Policy
										</Anchor>
										.
									</Text>
									<Text>
										Using the Fontsource public CDN causes browsers to connect
										to jsDelivr and the services it uses to deliver files.
										Installing and self-hosting Fontsource packages avoids those
										CDN requests.
									</Text>
								</Box>
							</Box>
						</Box>

						<Box component="section" id="search" className={classes.section}>
							<Text component="span" className={classes.sectionNumber}>
								02
							</Text>
							<Box>
								<Title order={2} className={classes.sectionTitle}>
									Search
								</Title>
								<Box className={classes.copy}>
									<Text>
										Fontsource uses Algolia to provide catalogue search. Algolia
										may process information needed to return search results. You
										can read the{' '}
										<Anchor
											href="https://www.algolia.com/policies/privacy"
											target="_blank"
											rel="noreferrer"
										>
											Algolia Privacy Policy
										</Anchor>
										.
									</Text>
								</Box>
							</Box>
						</Box>

						<Box
							component="section"
							id="advertising"
							className={classes.section}
						>
							<Text component="span" className={classes.sectionNumber}>
								03
							</Text>
							<Box>
								<Title order={2} className={classes.sectionTitle}>
									Advertising
								</Title>
								<Box className={classes.copy}>
									<Text>
										Some pages may display ads provided by Carbon Ads. Carbon
										may process information needed to deliver and measure those
										ads and may use browser storage. You can read the{' '}
										<Anchor
											href="https://www.carbonads.net/privacy"
											target="_blank"
											rel="noreferrer"
										>
											Carbon Ads Privacy Policy
										</Anchor>
										.
									</Text>
								</Box>
							</Box>
						</Box>

						<Box
							component="section"
							id="browser-storage"
							className={classes.section}
						>
							<Text component="span" className={classes.sectionNumber}>
								04
							</Text>
							<Box>
								<Title order={2} className={classes.sectionTitle}>
									Information stored in your browser
								</Title>
								<Box className={classes.copy}>
									<Text>
										Fontsource may store information in your browser to support
										site features. You can remove it by clearing the site's data
										in your browser.
									</Text>
									<Text>
										Some tools may also process information locally in your
										browser.
									</Text>
								</Box>
							</Box>
						</Box>

						<Box component="section" id="contact" className={classes.section}>
							<Text component="span" className={classes.sectionNumber}>
								05
							</Text>
							<Box>
								<Title order={2} className={classes.sectionTitle}>
									Contact
								</Title>
								<Box className={classes.copy}>
									<Text>
										For privacy questions, email{' '}
										<Anchor href="mailto:hello@ayuhito.com">
											hello@ayuhito.com
										</Anchor>
										.
									</Text>
								</Box>
							</Box>
						</Box>

						<Box component="section" id="changes" className={classes.section}>
							<Text component="span" className={classes.sectionNumber}>
								06
							</Text>
							<Box>
								<Title order={2} className={classes.sectionTitle}>
									Changes to this notice
								</Title>
								<Box className={classes.copy}>
									<Text>
										We may update this notice as Fontsource's services change.
										The date at the top shows when it was last updated.
									</Text>
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			</Container>
		</>
	);
}
