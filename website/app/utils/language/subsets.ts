// A map of subset values which doesn't work with titlecase and is also options for the search bar
export const subsetToLanguage = (subset: string) => {
	switch (subset) {
		case 'chinese-hongkong': {
			return 'Chinese (Hong Kong)';
		}
		case 'chinese-simplified': {
			return 'Chinese (Simplified)';
		}
		case 'chinese-traditional': {
			return 'Chinese (Traditional)';
		}
		case 'cyrillic-ext': {
			return 'Cyrillic Extended';
		}
		case 'greek-ext': {
			return 'Greek Extended';
		}
		case 'latin-ext': {
			return 'Latin Extended';
		}
		default: {
			// Convert to titlecase and replace all dashes with spaces
			return subset
				.split('-')
				.map((word) => word[0].toUpperCase() + word.slice(1))
				.join(' ');
		}
	}
};
