export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) {
		return '0 bytes';
	}

	const k = 1024;
	const sizes = ['bytes', 'KB', 'MB', 'GB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};
