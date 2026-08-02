import { Link, useRevalidator } from 'react-router';

import type { RegistryDataState, RegistryFamily } from '@/utils/registry';

import classes from './LicenseReceipt.module.css';

type RegistryLicense = RegistryFamily['license'];

interface LicenseReceiptProps {
	familyId: string;
	license?: RegistryLicense;
	registryState: RegistryDataState;
}

const LicenseReceipt = ({
	familyId,
	license,
	registryState,
}: LicenseReceiptProps) => {
	const revalidator = useRevalidator();

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

	return (
		<section
			className={classes.receipt}
			aria-labelledby={`license-${familyId}`}
		>
			<div className={classes.heading}>
				<div>
					<span className={classes.status}>License</span>
					<h2 id={`license-${familyId}`}>{license.id}</h2>
					<p>Keep a copy of this license with any font files you share.</p>
				</div>
				<Link to={`/fonts/${familyId}/about#license`}>Read license</Link>
			</div>
		</section>
	);
};

export { LicenseReceipt };
