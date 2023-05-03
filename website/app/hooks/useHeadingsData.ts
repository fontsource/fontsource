import { useEffect, useState } from 'react';

export interface HeadingsData {
	id: string;
	title: string;
	items?: HeadingsData[];
}

const getNestedHeadings = (headingElements: HTMLHeadElement[]) => {
	const nestedHeadings: HeadingsData[] = [];

	for (const heading of headingElements) {
		const { innerText: title, id } = heading;

		if (heading.nodeName === 'H2') {
			nestedHeadings.push({ id, title, items: [] });
		} else if (heading.nodeName === 'H3' && nestedHeadings.length > 0) {
			// If items array is undefined, create it
			if (!nestedHeadings[nestedHeadings.length - 1].items) {
				nestedHeadings[nestedHeadings.length - 1].items = [];
			}

			// @ts-ignore - TS doesn't know that items is defined now
			nestedHeadings[nestedHeadings.length - 1].items.push({
				id,
				title,
			});
		}
	}

	return nestedHeadings;
};

export const useHeadingsData = () => {
	const [nestedHeadings, setNestedHeadings] = useState<HeadingsData[]>([]);

	useEffect(() => {
		const headingElements = Array.from(
			document.querySelectorAll('h2, h3')
		) as HTMLHeadElement[];

		const newNestedHeadings = getNestedHeadings(headingElements);
		setNestedHeadings(newNestedHeadings);
	}, []);

	return { nestedHeadings };
};
