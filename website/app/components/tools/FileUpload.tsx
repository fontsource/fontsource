import { Group, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconX } from '@tabler/icons-react';
import classes from './FileUpload.module.css';

interface FileUploadProps {
	onDrop: (files: File[]) => void;
	disabled?: boolean;
}

export const FileUpload = ({ onDrop, disabled }: FileUploadProps) => {
	return (
		<Dropzone
			onDrop={onDrop}
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
				gap="xl"
				mih={220}
				style={{ pointerEvents: 'none' }}
			>
				<Dropzone.Accept>
					<IconUpload className={classes.acceptIcon} stroke={1.5} />
				</Dropzone.Accept>
				<Dropzone.Reject>
					<IconX className={classes.rejectIcon} stroke={1.5} />
				</Dropzone.Reject>
				<Dropzone.Idle>
					<IconUpload className={classes.idleIcon} stroke={1.5} />
				</Dropzone.Idle>
				<div>
					<Text size="xl" inline>
						Drag fonts here or click to select files
					</Text>
					<Text size="sm" c="dimmed" inline mt={7}>
						Files are not uploaded to any server
					</Text>
				</div>
			</Group>
		</Dropzone>
	);
};
