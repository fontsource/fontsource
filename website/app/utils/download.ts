const triggerBlobDownload = (filename: string, blob: Blob) => {
	const objectUrl = URL.createObjectURL(blob);
	const anchor = document.createElement('a');

	try {
		anchor.href = objectUrl;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
	} finally {
		anchor.remove();
		window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
	}
};

export { triggerBlobDownload };
