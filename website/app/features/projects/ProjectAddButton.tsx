import { useValue } from '@legendapp/state/react';
import { IconCheck, IconStack2, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import { MAX_FONT_SET_SIZE } from './model';
import classes from './ProjectAddButton.module.css';

interface ProjectAddButtonProps {
	displayName: string;
	familyId: string;
}

const ProjectAddButton = ({ displayName, familyId }: ProjectAddButtonProps) => {
	const store = useCurrentProjectStore();
	const ready = useValue(store.ready$);
	const included = useValue(() =>
		store.getItems().some((saved) => saved.familyId === familyId),
	);
	const [feedback, setFeedback] = useState<'added' | 'full' | false>(false);
	const toastRef = useRef<HTMLDivElement>(null);
	const displayIncluded = ready && included;

	useEffect(() => {
		const toast = toastRef.current;
		if (!toast) return;

		if (feedback) {
			toast.showPopover?.();
			const timeout = window.setTimeout(() => setFeedback(false), 6500);
			return () => window.clearTimeout(timeout);
		}

		toast.hidePopover?.();
	}, [feedback]);

	const addItem = () => {
		const result = store.addItem({ familyId });
		if (result === 'added') setFeedback('added');
		if (result === 'full') setFeedback('full');
	};

	const undo = () => {
		store.removeItem(familyId);
		setFeedback(false);
	};

	return (
		<>
			{displayIncluded ? (
				<Link className={classes.button} to="/selected-fonts">
					<IconCheck aria-hidden size={18} />
					In font set
				</Link>
			) : (
				<button
					type="button"
					className={classes.button}
					disabled={!ready}
					title={!ready ? 'Your font set is loading' : undefined}
					onClick={addItem}
				>
					<IconStack2 aria-hidden size={18} />
					{!ready ? 'Font set loading…' : 'Add to font set'}
				</button>
			)}
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
							{feedback === 'added' ? (
								<>
									<strong>{displayName}</strong> added to your font set.
								</>
							) : (
								<>
									Your font set can contain up to {MAX_FONT_SET_SIZE} families.
								</>
							)}
						</span>
						<div>
							{feedback === 'added' && (
								<button type="button" onClick={undo}>
									Undo
								</button>
							)}
							<Link to="/selected-fonts">View font set</Link>
							<button
								type="button"
								className={classes.close}
								aria-label="Dismiss confirmation"
								onClick={() => setFeedback(false)}
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
