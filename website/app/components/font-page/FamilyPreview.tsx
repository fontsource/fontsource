import { Link } from 'react-router';

import {
	FamilyActions,
	FamilyIdentity,
	FamilyTabs,
} from '@/components/font-page/FamilyPageShell';

import classes from './FamilyPreview.module.css';
import { PreviewFontStyle, PreviewProvider } from './FamilyPreviewContext';
import { PreviewDrawer, PreviewInspector } from './FamilyPreviewInspector';
import { PreviewCanvas, PreviewToolbar } from './FamilyPreviewSpecimen';
import type { PreviewEditorProps } from './FamilyPreviewState';

type FamilyPreviewProps = PreviewEditorProps & { summary?: string };

export const FamilyPreview = ({ summary, ...props }: FamilyPreviewProps) => {
	const { metadata, variable, registry } = props;
	return (
		<PreviewProvider {...props}>
			<section className={classes.page}>
				<PreviewFontStyle />
				<div className={classes.workbench}>
					<div className={classes.identityPanel}>
						<div>
							<FamilyIdentity
								metadata={metadata}
								registry={registry}
								variableAvailable={Boolean(variable)}
							/>
							{summary && <p className={classes.summary}>{summary}</p>}
							<Link
								className={classes.licenseSignal}
								to={`/fonts/${metadata.id}/about#license`}
							>
								{`${registry.license.id} license`}
							</Link>
						</div>
						<FamilyActions metadata={metadata} registry={registry} />
					</div>

					<FamilyTabs metadata={metadata} registry={registry} contained />

					<div className={classes.studio}>
						<div className={classes.specimenColumn}>
							<PreviewToolbar />
							<PreviewCanvas />
						</div>

						<aside className={classes.inspector} aria-label="Preview settings">
							<PreviewInspector idPrefix="desktop-preview" embedded />
						</aside>
					</div>
				</div>

				<PreviewDrawer />
			</section>
		</PreviewProvider>
	);
};
