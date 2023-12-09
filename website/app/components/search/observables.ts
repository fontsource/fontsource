import { observable } from '@legendapp/state';

// Primitives
export const size = observable(32);

// Text preview
export const previewLabel = observable('Sentence');
export const previewValue = observable('Sphinx of black quartz, judge my vow.');
export const previewInputView = observable('');

previewInputView.onChange((e) => {
	if (e.value !== '') {
		previewLabel.set('Custom');
		previewValue.set(e.value ?? '');
	}
});

type DisplayValues = 'list' | 'grid';
export const display = observable<DisplayValues>('grid');
