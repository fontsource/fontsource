import { Link } from 'react-router';

import {
	FamilyActions,
	FamilyIdentity,
	FamilyTabs,
} from '@/components/font-page/FamilyPageShell';
import type { RegistryDataState } from '@/utils/registry';

import classes from './FamilyPreview.module.css';
import {
	PreviewFontStyle,
	PreviewHandoffNotice,
	PreviewProvider,
} from './FamilyPreviewContext';
import { PreviewDrawer, PreviewInspector } from './FamilyPreviewInspector';
import { PreviewCanvas, PreviewToolbar } from './FamilyPreviewSpecimen';
import type { PreviewEditorProps } from './FamilyPreviewState';

interface FamilyPreviewProps extends PreviewEditorProps {
	registryState: RegistryDataState;
	variableUnavailable?: boolean;
}

export const FamilyPreview = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	registryState,
	languages,
	axisRegistry,
	capabilities,
	capabilitySource,
	symbols,
	variableUnavailable = false,
}: FamilyPreviewProps) => {
	return (
		<PreviewProvider
			metadata={metadata}
			staticCSS={staticCSS}
			variable={variable}
			variableCSS={variableCSS}
			versions={versions}
			registry={registry}
			languages={languages}
			axisRegistry={axisRegistry}
			capabilities={capabilities}
			capabilitySource={capabilitySource}
			symbols={symbols}
		>
			<section className={classes.page}>
				<PreviewFontStyle />
				<div className={classes.workbench}>
					<div className={classes.identityPanel}>
						<div>
							<FamilyIdentity
								metadata={metadata}
								registry={registry}
								variableAvailable={Boolean(variable)}
								compact
							/>
							<Link
								className={classes.licenseSignal}
								to={`/fonts/${metadata.id}/about#license`}
							>
								{registry?.license
									? `${registry.license.id} license`
									: registryState === 'unavailable'
										? 'License details temporarily unavailable'
										: 'License details unavailable'}
							</Link>
						</div>
						<FamilyActions metadata={metadata} compact />
					</div>

					<FamilyTabs metadata={metadata} registry={registry} contained />

					{variableUnavailable && (
						<p className={classes.handoffNotice} role="status">
							Variable controls are temporarily unavailable. You can still
							preview the available styles.
						</p>
					)}

					<PreviewHandoffNotice />

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
