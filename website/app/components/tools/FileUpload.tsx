import { Group, Stack, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconX } from '@tabler/icons-react';
import classes from './FileUpload.module.css';

interface FileUploadProps {
	onDrop: (files: File[]) => void;
	onReject: () => void;
	disabled?: boolean;
	compact: boolean;
}

export const FileUpload = ({
	onDrop,
	onReject,
	disabled,
	compact,
}: FileUploadProps) => {
	const iconSize = compact ? 28 : 52;

	return (
		<Dropzone
			onDrop={onDrop}
			onReject={onReject}
			maxSize={250 * 1024 ** 2} // 250MB
			accept={{
				'font/ttf': ['.ttf'],
				'font/otf': ['.otf'],
				'font/woff': ['.woff'],
				'font/woff2': ['.woff2'],
			}}
			disabled={disabled}
			className={classes.dropzone}
		>
			<Group
				justify="center"
				gap={compact ? 'md' : 'xl'}
				wrap={compact ? 'nowrap' : 'wrap'}
				mih={compact ? 84 : { base: 160, sm: 220 }}
				style={{ pointerEvents: 'none' }}
			>
				<Dropzone.Accept>
					<IconUpload
						className={classes.acceptIcon}
						stroke={1.5}
						size={iconSize}
					/>
				</Dropzone.Accept>
				<Dropzone.Reject>
					<IconX className={classes.rejectIcon} stroke={1.5} size={iconSize} />
				</Dropzone.Reject>
				<Dropzone.Idle>
					<IconUpload
						className={classes.idleIcon}
						stroke={1.5}
						size={iconSize}
					/>
				</Dropzone.Idle>
				<Stack gap={7} style={{ minWidth: 0 }}>
					<Text size={compact ? 'md' : 'xl'}>
						{compact
							? 'Add more fonts'
							: 'Drag fonts here or click to select files'}
					</Text>
					<Text size="sm" c="dimmed">
						TTF, OTF, WOFF, WOFF2 · 250 MB total · processed locally
					</Text>
				</Stack>
			</Group>
		</Dropzone>
	);
};
