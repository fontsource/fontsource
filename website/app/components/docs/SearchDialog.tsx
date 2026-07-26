import { Modal, VisuallyHidden } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';

import { Skeleton } from '@/components/Skeleton';

import classes from './SearchDialog.module.css';

interface SearchResult {
	id: string;
	url: string;
	type: 'page' | 'heading' | 'text';
	content: string;
	breadcrumbs?: string[];
}

interface SearchDialogProps {
	open: boolean;
	onClose: () => void;
}

const renderResultContent = (value: string) => {
	let highlighted = false;
	let offset = 0;

	return value.split(/(<mark>|<\/mark>)/).map((part) => {
		if (part === '<mark>') {
			highlighted = true;
			return null;
		}

		if (part === '</mark>') {
			highlighted = false;
			return null;
		}

		if (!part) return null;

		const key = `${offset}-${part}`;
		offset += part.length;

		return highlighted ? <mark key={key}>{part}</mark> : part;
	});
};

const searchSkeletonRows = [
	{
		breadcrumbs: 'Getting started / Install',
		content: 'Install Fontsource packages in your project.',
	},
	{
		breadcrumbs: 'Guides / Next.js',
		content: 'Use Fontsource with framework-specific bundlers.',
	},
	{
		breadcrumbs: 'API / Fonts',
		content: 'Query font metadata and available variants.',
	},
];

export const SearchDialog = ({ open, onClose }: SearchDialogProps) => {
	const inputId = useId();
	const resultsId = useId();
	const statusId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchFailed, setSearchFailed] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const trimmedQuery = query.trim();
	const showSearchSkeleton = trimmedQuery.length >= 2 && loading;
	const showSearchError = trimmedQuery.length >= 2 && !loading && searchFailed;
	const statusMessage =
		trimmedQuery.length < 2
			? 'Search by page title, heading, or text.'
			: loading
				? 'Searching...'
				: !searchFailed && results.length === 0
					? 'No results found.'
					: undefined;

	useEffect(() => {
		if (!open) return;
		if (trimmedQuery.length < 2) {
			setResults([]);
			setLoading(false);
			setSearchFailed(false);
			return;
		}

		const controller = new AbortController();
		setLoading(true);
		setSearchFailed(false);
		const timeout = window.setTimeout(() => {
			void fetch(`/docs/search?query=${encodeURIComponent(trimmedQuery)}`, {
				signal: controller.signal,
				cache: retryCount > 0 ? 'reload' : 'default',
			})
				.then((response) => {
					if (!response.ok) throw new Error('Search request failed');
					return response.json() as Promise<SearchResult[]>;
				})
				.then((data) => {
					setResults(data);
					setSearchFailed(false);
				})
				.catch((error: unknown) => {
					if (!(error instanceof DOMException && error.name === 'AbortError')) {
						setResults([]);
						setSearchFailed(true);
					}
				})
				.finally(() => {
					if (!controller.signal.aborted) {
						setLoading(false);
					}
				});
		}, 180);

		return () => {
			controller.abort();
			window.clearTimeout(timeout);
		};
	}, [open, retryCount, trimmedQuery]);

	return (
		<Modal
			opened={open}
			onClose={onClose}
			aria-label="Search documentation"
			withCloseButton={false}
			closeOnClickOutside
			size="min(720px, calc(100vw - 48px))"
			yOffset="120px"
			padding={0}
			radius={8}
			overlayProps={{
				backgroundOpacity: 0.44,
				blur: 4,
				className: classes.overlay,
			}}
			classNames={{
				content: classes.dialog,
				body: classes.body,
			}}
		>
			<label className={classes.search} htmlFor={inputId}>
				<IconSearch size={20} stroke={1.8} aria-hidden="true" />
				<VisuallyHidden>Search documentation</VisuallyHidden>
				<input
					id={inputId}
					data-autofocus
					ref={inputRef}
					type="search"
					autoComplete="off"
					aria-controls={resultsId}
					aria-describedby={statusMessage ? statusId : undefined}
					value={query}
					onChange={(event) => {
						setRetryCount(0);
						setQuery(event.currentTarget.value);
					}}
					placeholder="Search documentation..."
				/>
			</label>
			<div className={classes.results} id={resultsId}>
				{showSearchError && (
					<div className={classes.error}>
						<p id={statusId} role="status">
							Search could not load. Check your connection and try again.
						</p>
						<button
							type="button"
							onClick={() => {
								setSearchFailed(false);
								setLoading(true);
								setRetryCount((count) => count + 1);
								inputRef.current?.focus();
							}}
						>
							Try again
						</button>
					</div>
				)}
				{statusMessage && showSearchSkeleton && (
					<VisuallyHidden id={statusId} role="status">
						{statusMessage}
					</VisuallyHidden>
				)}
				{statusMessage && !showSearchSkeleton && (
					<p className={classes.empty} id={statusId} role="status">
						{statusMessage}
					</p>
				)}
				{showSearchSkeleton && (
					<Skeleton name="docs-search-results" loading>
						<ul className={classes.list} aria-hidden="true">
							{searchSkeletonRows.map((result) => (
								<li key={result.breadcrumbs}>
									<span className={classes.result}>
										<span className={classes.breadcrumbs}>
											{result.breadcrumbs}
										</span>
										<span className={classes.content}>{result.content}</span>
									</span>
								</li>
							))}
						</ul>
					</Skeleton>
				)}
				{!showSearchSkeleton && !showSearchError && results.length > 0 && (
					<ul className={classes.list} aria-label="Search results">
						{results.map((result) => (
							<li key={result.id}>
								<Link
									to={result.url}
									className={classes.result}
									prefetch="intent"
									onClick={onClose}
								>
									<span className={classes.breadcrumbs}>
										{result.breadcrumbs?.join(' / ') ?? result.type}
									</span>
									<span className={classes.content}>
										{renderResultContent(result.content)}
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</div>
		</Modal>
	);
};
