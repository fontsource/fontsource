import { useValue } from '@legendapp/state/react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconStack2, IconX } from '@tabler/icons-react';
import { useEffect, useId } from 'react';
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
	const notificationId = `${useId()}-${familyId}`;
	const displayIncluded = ready && included;

	useEffect(
		() => () => {
			notifications.hide(notificationId);
		},
		[notificationId],
	);

	const addItem = () => {
		const result = store.addItem({ familyId });
		if (result !== 'added' && result !== 'full') return;

		notifications.hide(notificationId);
		notifications.show({
			id: notificationId,
			message: '',
			role: 'status',
			'aria-live': 'polite',
			'aria-atomic': true,
			autoClose: 6500,
			renderNotification: () => (
				<div className={classes.toast}>
					<span>
						{result === 'added' ? (
							<>
								<strong>{displayName}</strong> added to your font set.
							</>
						) : (
							<>Your font set can contain up to {MAX_FONT_SET_SIZE} families.</>
						)}
					</span>
					<div>
						{result === 'added' && (
							<button
								type="button"
								onClick={() => {
									store.removeItem(familyId);
									notifications.hide(notificationId);
								}}
							>
								Undo
							</button>
						)}
						<Link to="/selected-fonts">View font set</Link>
						<button
							type="button"
							className={classes.close}
							aria-label="Dismiss confirmation"
							onClick={() => notifications.hide(notificationId)}
						>
							<IconX aria-hidden size={17} />
						</button>
					</div>
				</div>
			),
		});
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
		</>
	);
};

export { ProjectAddButton };
