import { Group, Text, useMantineTheme } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconX } from '@tabler/icons-react';

interface FileUploadProps {
	onDrop: (files: File[]) => void;
	disabled?: boolean;
}

export const FileUpload = ({ onDrop, disabled }: FileUploadProps) => {
	const theme = useMantineTheme();

	return (
		<Dropzone
			onDrop={onDrop}
			maxSize={250 * 1024 ** 2} // 250MB
			accept={['font/ttf', 'font/otf', 'font/woff', 'font/woff2']}
			disabled={disabled}
		>
			<Group
				justify="center"
				gap="xl"
				mih={220}
				style={{ pointerEvents: 'none' }}
			>
				<Dropzone.Accept>
					<IconUpload
						style={{ width: 52, height: 52, color: theme.colors.blue[6] }}
						stroke={1.5}
					/>
				</Dropzone.Accept>
				<Dropzone.Reject>
					<IconX
						style={{ width: 52, height: 52, color: theme.colors.red[6] }}
						stroke={1.5}
					/>
				</Dropzone.Reject>
				<Dropzone.Idle>
					<IconUpload
						style={{ width: 52, height: 52, color: theme.colors.text[1] }}
						stroke={1.5}
					/>
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
