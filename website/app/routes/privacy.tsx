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
			'How Fontsource and its service providers handle information across the website, API, and public CDN.',
	});

const sections = [
	{ href: '#requests', label: 'Website, API, and CDN' },
	{ href: '#search', label: 'Search' },
	{ href: '#advertising', label: 'Advertising' },
	{ href: '#browser-storage', label: 'Browser storage' },
	{ href: '#analytics', label: 'Analytics' },
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
				description="How Fontsource and its service providers handle information when you use the website, API, and public CDN."
			/>
			<Container className={classes.container}>
				<Box className={classes.layout}>
					<Box component="aside" className={classes.sidebar}>
						<Box className={classes.updated}>
							<Text className={classes.label}>Last updated</Text>
							<Text className={classes.date}>September 21, 2026</Text>
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
								and API. Our public content delivery network (CDN) uses
								jsDelivr. These providers may process technical information
								needed to provide those services. You can read the{' '}
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
								If you use the public CDN on your website, your visitors'
								browsers connect to jsDelivr and its delivery providers to load
								fonts. Self-hosting Fontsource packages avoids these requests.
							</Text>
						</PolicySection>

						<PolicySection id="search" number="02" title="Search">
							<Text>
								We use Algolia for font search. Your search terms and filters
								are sent to Algolia to return matching fonts. You can read the{' '}
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
								Some pages display ads from Carbon Ads. Carbon may process
								information needed to deliver and measure those ads and may use
								browser storage. You can read the{' '}
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
								We save your collections and current font set in your browser so
								they are available when you return. Clearing Fontsource's site
								data in your browser removes these saved items.
							</Text>
							<Text>
								Our font tools process the files you select locally in your
								browser, without uploading them to a server.
							</Text>
						</PolicySection>

						<PolicySection id="analytics" number="05" title="Analytics">
							<Text>
								We use PostHog to understand how people use the website and
								improve it. PostHog collects page views, interactions such as
								clicks, and browser and device information.
							</Text>
							<Text>
								We use cookieless analytics: PostHog does not store analytics
								identifiers in cookies, local storage, or session storage. It
								processes technical request information, including IP address
								and browser information, to generate a temporary identifier on
								its servers.
							</Text>
							<Text>
								We use PostHog's EU hosting region. You can read the{' '}
								<Anchor
									href="https://posthog.com/privacy"
									target="_blank"
									rel="noreferrer"
								>
									PostHog Privacy Policy
								</Anchor>
								.
							</Text>
						</PolicySection>

						<PolicySection id="contact" number="06" title="Contact">
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
							number="07"
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
