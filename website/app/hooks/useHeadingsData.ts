import { useEffect, useState } from 'react';

export interface HeadingsData {
	id: string;
	title: string;
	items?: HeadingsData[];
}

const getNestedHeadings = (headingElements: HTMLHeadElement[]) => {
	const nestedHeadings: HeadingsData[] = [];

	for (const heading of headingElements) {
		const { textContent, id, nodeName } = heading;
		const title = String(textContent);

		if (nodeName === 'H2') {
			nestedHeadings.push({ id, title, items: [] });
		} else if (nodeName === 'H3' && nestedHeadings.length > 0) {
			// If items array is undefined, create it
			if (!nestedHeadings.at(-1)?.items) {
				// eslint-disable-next-line unicorn/prefer-at
				nestedHeadings[nestedHeadings.length - 1].items = [];
			}

			// @ts-expect-error - TS doesn't know that items is defined now
			nestedHeadings.at(-1).items.push({
				id,
				title,
			});
		}
	}

	return nestedHeadings;
};

// We need to trigger a dependency update when the page changes
export const useHeadingsData = (page: string) => {
	const [nestedHeadings, setNestedHeadings] = useState<HeadingsData[]>([]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const headingElements = [...document.querySelectorAll('h2, h3')];

		const newNestedHeadings = getNestedHeadings(
			headingElements as HTMLHeadElement[],
		);
		setNestedHeadings(newNestedHeadings);
	}, [page]);

	return { nestedHeadings };
};
