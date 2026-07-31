import { useClipboard } from '@mantine/hooks';
import { useState } from 'react';
import { Link } from 'react-router';

import type { GetRegistryFamilyResponse } from '@/generated/api';
import { triggerBlobDownload } from '@/utils/download';

import classes from './LicenseReceipt.module.css';

type RegistryLicense = GetRegistryFamilyResponse['license'];

interface LicenseReceiptProps {
	familyId: string;
	family: string;
	license?: RegistryLicense;
	registryUnavailable?: boolean;
	variant?: 'receipt' | 'detail';
}

const LicenseReceipt = ({
	familyId,
	family,
	license,
	registryUnavailable = false,
	variant = 'receipt',
}: LicenseReceiptProps) => {
	const attributionClipboard = useClipboard({ timeout: 1500 });
	const licenseClipboard = useClipboard({ timeout: 1500 });
	const [downloadError, setDownloadError] = useState(false);
	const isDetail = variant === 'detail';

	if (!license) {
		return (
			<section
				className={classes.receipt}
				data-warning
				aria-labelledby={`license-${familyId}`}
				id={isDetail ? 'license' : undefined}
			>
				<div className={classes.heading}>
					<div>
						<span className={classes.status}>Verification unavailable</span>
						<h2 id={`license-${familyId}`}>License needs verification</h2>
						<p>
							{registryUnavailable
								? 'The registry could not be reached, so Fontsource is not showing a legacy license as verified.'
								: 'This family does not have a verified registry license record yet.'}
						</p>
					</div>
					<Link to={`/fonts/${familyId}/about#license`}>
						Check license details
					</Link>
				</div>
			</section>
		);
	}

	const title = license.id;
	const attribution =
		license.attribution ??
		`${family} is distributed under the ${license.id} license.`;
	const downloadLicense = () => {
		try {
			triggerBlobDownload(
				`${familyId}-LICENSE.txt`,
				new Blob([license.text ?? ''], { type: 'text/plain' }),
			);
			setDownloadError(false);
		} catch {
			setDownloadError(true);
		}
	};

	return (
		<section
			className={classes.receipt}
			data-detail={isDetail || undefined}
			aria-labelledby={`license-${familyId}`}
			id={isDetail ? 'license' : undefined}
		>
			<div className={classes.heading}>
				<div>
					<span className={classes.status}>Registry license record</span>
					<h2 id={`license-${familyId}`}>
						{isDetail ? 'License and permissions' : title}
					</h2>
					{isDetail ? (
						<>
							<strong>{title}</strong>
							<p>
								{license.text
									? 'The complete license text is included below for review, copying, and download.'
									: 'Open the legal source before redistributing or modifying this font.'}
							</p>
						</>
					) : (
						<p>
							{license.id} · Keep the supplied license with redistributed font
							files.
						</p>
					)}
				</div>
				{!isDetail && (
					<Link to={`/fonts/${familyId}/about#license`}>License details</Link>
				)}
			</div>

			{isDetail && (
				<>
					<p className={classes.disclaimer}>
						This summary is a practical guide, not legal advice. The exact
						license text controls.
					</p>
					<div className={classes.actions}>
						<a href={license.url} target="_blank" rel="noreferrer">
							Open legal source
						</a>
						<button
							type="button"
							onClick={() => attributionClipboard.copy(attribution)}
						>
							{attributionClipboard.copied
								? 'Attribution copied'
								: attributionClipboard.error
									? 'Copy failed'
									: 'Copy attribution'}
						</button>
						{license.text && (
							<>
								<button
									type="button"
									onClick={() => licenseClipboard.copy(license.text ?? '')}
								>
									{licenseClipboard.copied
										? 'LICENSE copied'
										: licenseClipboard.error
											? 'Copy failed'
											: 'Copy LICENSE'}
								</button>
								<button type="button" onClick={downloadLicense}>
									{downloadError
										? 'Try LICENSE download again'
										: 'Download LICENSE'}
								</button>
							</>
						)}
					</div>
					{attributionClipboard.error && (
						<p className={classes.actionError} role="status">
							Clipboard access was blocked. Select and copy this attribution:{' '}
							<code>{attribution}</code>
						</p>
					)}
					{licenseClipboard.error && (
						<p className={classes.actionError} role="status">
							Clipboard access was blocked. Open the full license text below and
							copy it manually.
						</p>
					)}
					{downloadError && (
						<p className={classes.actionError} role="status">
							This browser could not create the license download. The full text
							remains available below.
						</p>
					)}
					{license.text && (
						<details className={classes.fullText}>
							<summary>Read the full license text</summary>
							<pre>{license.text}</pre>
						</details>
					)}
				</>
			)}
		</section>
	);
};

export { LicenseReceipt };
