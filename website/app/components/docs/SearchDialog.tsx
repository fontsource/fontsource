import { Modal, VisuallyHidden } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';

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

export const SearchDialog = ({ open, onClose }: SearchDialogProps) => {
	const inputId = useId();
	const resultsId = useId();
	const statusId = useId();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const trimmedQuery = query.trim();

	useEffect(() => {
		if (!open) return;
		if (trimmedQuery.length < 2) {
			setResults([]);
			setLoading(false);
			return;
		}

		const controller = new AbortController();
		setLoading(true);
		const timeout = window.setTimeout(() => {
			void fetch(`/docs/search?query=${encodeURIComponent(trimmedQuery)}`, {
				signal: controller.signal,
			})
				.then((response) => {
					if (!response.ok) throw new Error('Search request failed');
					return response.json() as Promise<SearchResult[]>;
				})
				.then((data) => {
					setResults(data);
				})
				.catch((error: unknown) => {
					if (!(error instanceof DOMException && error.name === 'AbortError')) {
						setResults([]);
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
	}, [open, trimmedQuery]);

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
					type="search"
					autoComplete="off"
					aria-controls={resultsId}
					aria-describedby={statusId}
					value={query}
					onChange={(event) => {
						setQuery(event.currentTarget.value);
					}}
					placeholder="Search documentation..."
				/>
			</label>
			<div className={classes.results} id={resultsId}>
				{trimmedQuery.length < 2 && (
					<p className={classes.empty} id={statusId} role="status">
						Search by page title, heading, or text.
					</p>
				)}
				{loading && (
					<p className={classes.empty} id={statusId} role="status">
						Searching...
					</p>
				)}
				{!loading && trimmedQuery.length >= 2 && results.length === 0 && (
					<p className={classes.empty} id={statusId} role="status">
						No results found.
					</p>
				)}
				{results.length > 0 && (
					<ul className={classes.list} aria-label="Search results">
						{results.map((result) => (
							<li key={result.id}>
								<Link
									to={result.url}
									className={classes.result}
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
