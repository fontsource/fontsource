import { useValue } from '@legendapp/state/react';
import { IconCheck, IconStack2, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import type { ProjectItem } from './model';
import classes from './ProjectAddButton.module.css';

interface ProjectAddButtonProps {
	includedLabel?: string;
	item: ProjectItem;
	label?: string;
}

interface Feedback {
	previous?: ProjectItem;
}

const ProjectAddButton = ({
	includedLabel = 'Update this setup',
	item,
	label = 'Add this setup',
}: ProjectAddButtonProps) => {
	const store = useCurrentProjectStore();
	const ready = useValue(store.ready$);
	const included = useValue(() => store.hasItem(item.familyId));
	const [hydrated, setHydrated] = useState(false);
	const [feedback, setFeedback] = useState<Feedback>();
	const toastRef = useRef<HTMLDivElement>(null);
	const interactive = hydrated && ready;
	const displayIncluded = interactive && included;

	useEffect(() => setHydrated(true), []);

	useEffect(() => {
		const toast = toastRef.current;
		if (!toast) return;

		if (feedback) {
			if ('showPopover' in toast && !toast.matches(':popover-open')) {
				toast.showPopover();
			}
			const timeout = window.setTimeout(() => setFeedback(undefined), 6500);
			return () => window.clearTimeout(timeout);
		}

		if ('hidePopover' in toast && toast.matches(':popover-open')) {
			toast.hidePopover();
		}
	}, [feedback]);

	const addItem = () => {
		const previous = store.upsertItem(item);
		setFeedback({ previous });
	};

	const undo = () => {
		if (feedback?.previous) {
			store.upsertItem(feedback.previous);
		} else {
			store.removeItem(item.familyId);
		}
		setFeedback(undefined);
	};

	return (
		<>
			<button
				type="button"
				className={classes.button}
				disabled={!interactive}
				title={!interactive ? 'Your font set is loading' : undefined}
				onClick={addItem}
			>
				{displayIncluded ? (
					<IconCheck aria-hidden size={18} />
				) : (
					<IconStack2 aria-hidden size={18} />
				)}
				{!interactive
					? 'Font set loading…'
					: displayIncluded
						? includedLabel
						: label}
			</button>
			<div
				ref={toastRef}
				className={classes.toast}
				popover="manual"
				data-open={feedback || undefined}
				aria-live="polite"
				aria-atomic="true"
			>
				{feedback && (
					<>
						<span>
							<strong>{item.displayName}</strong>{' '}
							{feedback.previous
								? 'setup updated in your font set.'
								: 'setup added to your font set.'}
						</span>
						<div>
							<button type="button" onClick={undo}>
								Undo
							</button>
							<Link to="/selected-fonts">View font set</Link>
							<button
								type="button"
								className={classes.close}
								aria-label="Dismiss confirmation"
								onClick={() => setFeedback(undefined)}
							>
								<IconX aria-hidden size={17} />
							</button>
						</div>
					</>
				)}
			</div>
		</>
	);
};

export { ProjectAddButton };
