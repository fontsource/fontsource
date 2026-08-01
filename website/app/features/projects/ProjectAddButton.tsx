import { useValue } from '@legendapp/state/react';
import { IconCheck, IconStack2, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import type { ProjectItem } from './model';
import classes from './ProjectAddButton.module.css';

interface ProjectAddButtonProps {
	item: ProjectItem;
}

interface Feedback {
	previous?: ProjectItem;
}

const ProjectAddButton = ({ item }: ProjectAddButtonProps) => {
	const store = useCurrentProjectStore();
	const ready = useValue(store.ready$);
	const included = useValue(() => store.hasItem(item.familyId));
	const [feedback, setFeedback] = useState<Feedback>();
	const toastRef = useRef<HTMLDivElement>(null);

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
				disabled={!ready}
				onClick={addItem}
			>
				{included ? (
					<IconCheck aria-hidden size={18} />
				) : (
					<IconStack2 aria-hidden size={18} />
				)}
				{included ? 'Update font set' : 'Add to font set'}
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
								? 'updated in your font set.'
								: 'added to your font set.'}
						</span>
						<div>
							<button type="button" onClick={undo}>
								Undo
							</button>
							<Link to="/selected-fonts">Open font set</Link>
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
