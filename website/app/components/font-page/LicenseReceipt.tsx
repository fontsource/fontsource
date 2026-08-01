import { useClipboard } from '@mantine/hooks';
import { useState } from 'react';
import { Link, useRevalidator } from 'react-router';

import { triggerBlobDownload } from '@/utils/download';
import type { RegistryDataState, RegistryFamily } from '@/utils/registry';

import classes from './LicenseReceipt.module.css';

type RegistryLicense = RegistryFamily['license'];

interface LicenseReceiptProps {
	familyId: string;
	family: string;
	license?: RegistryLicense;
	registryState: RegistryDataState;
	variant?: 'receipt' | 'detail';
}

const LicenseReceipt = ({
	familyId,
	family,
	license,
	registryState,
	variant = 'receipt',
}: LicenseReceiptProps) => {
	const attributionClipboard = useClipboard({ timeout: 1500 });
	const licenseClipboard = useClipboard({ timeout: 1500 });
	const revalidator = useRevalidator();
	const [downloadError, setDownloadError] = useState(false);
	const isDetail = variant === 'detail';

	if (!license) {
		const temporarilyUnavailable = registryState === 'unavailable';
		const missingCopy = temporarilyUnavailable
			? {
					status: 'License details unavailable',
					title: 'Check the license before sharing',
					description:
						'You can still preview, install, or download this font. Try again before redistributing its files.',
				}
			: registryState === 'not-found'
				? {
						status: 'License details unavailable',
						title: 'License details are not published yet',
						description:
							'Do not redistribute this font until its license details are available.',
					}
				: {
						status: 'License details unavailable',
						title: 'License details are incomplete',
						description:
							'Do not redistribute this font until the Registry includes its complete license details.',
					};
		return (
			<section
				className={classes.receipt}
				data-warning
				aria-labelledby={`license-${familyId}`}
				id={isDetail ? 'license' : undefined}
			>
				<div className={classes.heading}>
					<div>
						<span className={classes.status}>{missingCopy.status}</span>
						<h2 id={`license-${familyId}`}>{missingCopy.title}</h2>
						<p>{missingCopy.description}</p>
					</div>
					{temporarilyUnavailable && (
						<button
							type="button"
							disabled={revalidator.state !== 'idle'}
							onClick={() => void revalidator.revalidate()}
						>
							{revalidator.state === 'idle'
								? 'Try again'
								: 'Checking Registry…'}
						</button>
					)}
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
				new Blob([license.text], { type: 'text/plain' }),
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
					<span className={classes.status}>License</span>
					<h2 id={`license-${familyId}`}>
						{isDetail ? 'License and permissions' : title}
					</h2>
					{isDetail ? (
						<>
							<strong>{title}</strong>
							<p>Review, copy, or download the complete license text.</p>
						</>
					) : (
						<p>Keep a copy of this license with any font files you share.</p>
					)}
				</div>
				{!isDetail && (
					<Link to={`/fonts/${familyId}/about#license`}>Read license</Link>
				)}
			</div>

			{isDetail && (
				<>
					<p className={classes.disclaimer}>
						This summary is not legal advice. The full license text below sets
						the terms.
					</p>
					<div className={classes.actions}>
						<a href={license.url} target="_blank" rel="noreferrer">
							Open license source
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
						<button
							type="button"
							onClick={() => licenseClipboard.copy(license.text)}
						>
							{licenseClipboard.copied
								? 'License text copied'
								: licenseClipboard.error
									? 'Copy failed'
									: 'Copy license text'}
						</button>
						<button type="button" onClick={downloadLicense}>
							{downloadError
								? 'Try license download again'
								: 'Download license text'}
						</button>
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
					<details className={classes.fullText}>
						<summary>Read full license text</summary>
						<pre>{license.text}</pre>
					</details>
				</>
			)}
		</section>
	);
};

export { LicenseReceipt };
