import { Anchor, Box, Container, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import type { MetaFunction } from 'react-router';
import { ContentHeader } from '@/components/layout/ContentHeader';
import classes from '@/styles/privacy.module.css';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Privacy Policy | Fontsource',
		description:
			'How Fontsource approaches privacy across its website and services.',
	});

const sections = [
	{ href: '#requests', label: 'Website, API, and CDN' },
	{ href: '#search', label: 'Search' },
	{ href: '#advertising', label: 'Advertising' },
	{ href: '#browser-storage', label: 'Browser storage' },
	{ href: '#contact', label: 'Contact' },
	{ href: '#changes', label: 'Changes' },
];

interface PolicySectionProps {
	children: ReactNode;
	id: string;
	number: string;
	title: string;
}

const PolicySection = ({ children, id, number, title }: PolicySectionProps) => (
	<Box component="section" id={id} className={classes.section}>
		<Text component="span" className={classes.sectionNumber}>
			{number}
		</Text>
		<Box>
			<Title order={2} className={classes.sectionTitle}>
				{title}
			</Title>
			<Box className={classes.copy}>{children}</Box>
		</Box>
	</Box>
);

export default function PrivacyPage() {
	return (
		<>
			<ContentHeader
				title="Privacy Policy"
				description={
					<>
						Fontsource is an{' '}
						<Anchor
							href="https://github.com/fontsource/fontsource"
							target="_blank"
							rel="noreferrer"
							inherit
						>
							open-source
						</Anchor>{' '}
						project for self-hostable fonts.
					</>
				}
			/>
			<Container className={classes.container}>
				<Box className={classes.layout}>
					<Box component="aside" className={classes.sidebar}>
						<Box className={classes.updated}>
							<Text className={classes.label}>Last updated</Text>
							<Text className={classes.date}>July 25, 2026</Text>
						</Box>

						<Box component="nav" aria-label="Privacy policy sections">
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
						<PolicySection
							id="requests"
							number="01"
							title="Website, API, and CDN requests"
						>
							<Text>
								Fontsource uses Cloudflare to deliver and protect its website
								and API, and partners with jsDelivr to provide its public CDN.
								These providers may process technical information needed to
								provide those services. You can read the{' '}
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
								Using the Fontsource public CDN causes browsers to connect to
								jsDelivr and the services it uses to deliver files. Installing
								and self-hosting Fontsource packages avoids those CDN requests.
							</Text>
						</PolicySection>

						<PolicySection id="search" number="02" title="Search">
							<Text>
								Fontsource uses Algolia to provide catalogue search. Algolia may
								process information needed to return search results. You can
								read the{' '}
								<Anchor
									href="https://www.algolia.com/policies/privacy"
									target="_blank"
									rel="noreferrer"
								>
									Algolia Privacy Policy
								</Anchor>
								.
							</Text>
						</PolicySection>

						<PolicySection id="advertising" number="03" title="Advertising">
							<Text>
								Some pages may display ads provided by Carbon Ads. Carbon may
								process information needed to deliver and measure those ads and
								may use browser storage. You can read the{' '}
								<Anchor
									href="https://www.carbonads.net/privacy"
									target="_blank"
									rel="noreferrer"
								>
									Carbon Ads Privacy Policy
								</Anchor>
								.
							</Text>
						</PolicySection>

						<PolicySection
							id="browser-storage"
							number="04"
							title="Information stored in your browser"
						>
							<Text>
								Fontsource may store information in your browser to support site
								features. You can remove it by clearing the site's data in your
								browser.
							</Text>
							<Text>
								Some tools may also process information locally in your browser.
							</Text>
						</PolicySection>

						<PolicySection id="contact" number="05" title="Contact">
							<Text>
								For privacy questions, email{' '}
								<Anchor href="mailto:hello@ayuhito.com">
									hello@ayuhito.com
								</Anchor>
								.
							</Text>
						</PolicySection>

						<PolicySection
							id="changes"
							number="06"
							title="Changes to this policy"
						>
							<Text>
								We may update this policy as Fontsource's services change. The
								date at the top shows when it was last updated.
							</Text>
						</PolicySection>
					</Box>
				</Box>
			</Container>
		</>
	);
}
