import { useEffect, useRef } from 'react';

type HeadingIntersectionEntry = Record<string, IntersectionObserverEntry>;

export const useIntersectionObserver = (
	setActiveId: React.Dispatch<React.SetStateAction<string>>,
	page: string,
) => {
	const headingElementsRef = useRef<HeadingIntersectionEntry>({});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		headingElementsRef.current = {}; // Reset ref on page change to update active states
		const headingElements = [...document.querySelectorAll('h2, h3')];

		const callback = (headings: IntersectionObserverEntry[]) => {
			headingElementsRef.current = headings.reduce(
				(
					map: HeadingIntersectionEntry,
					headingElement: IntersectionObserverEntry,
				) => {
					map[headingElement.target.id] = headingElement;
					return map;
				},
				headingElementsRef.current,
			);

			const visibleHeadings: IntersectionObserverEntry[] = [];
			for (const key of Object.keys(headingElementsRef.current)) {
				const headingElement = headingElementsRef.current[key];
				if (headingElement.isIntersecting) visibleHeadings.push(headingElement);
			}

			// eslint-disable-next-line unicorn/consistent-function-scoping
			const getIndexFromId = (id: string) =>
				headingElements.findIndex((heading) => heading.id === id);

			if (visibleHeadings.length === 1) {
				setActiveId(visibleHeadings[0].target.id);
			} else if (visibleHeadings.length > 1) {
				const sortedVisibleHeadings = visibleHeadings.sort(
					// @ts-expect-error - Technically, booleans can't be compared, but this works
					(a, b) => getIndexFromId(a.target.id) > getIndexFromId(b.target.id),
				);
				setActiveId(sortedVisibleHeadings[0].target.id);
			}
		};

		const observer = new IntersectionObserver(callback, {
			rootMargin: '0px 0px -40% 0px',
		});

		for (const element of headingElements) observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [setActiveId, page]);
};
