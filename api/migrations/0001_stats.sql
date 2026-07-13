CREATE TABLE stats_packages (
	package_name TEXT PRIMARY KEY,
	family_id TEXT NOT NULL,
	kind TEXT NOT NULL CHECK (kind IN ('legacy', 'static', 'variable')),
	active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
	created_day TEXT,
	npm_monthly INTEGER NOT NULL DEFAULT 0 CHECK (npm_monthly >= 0),
	jsdelivr_monthly INTEGER NOT NULL DEFAULT 0 CHECK (jsdelivr_monthly >= 0),
	last_success_at TEXT,
	last_error TEXT
);

CREATE TABLE stats_periods (
	package_name TEXT NOT NULL,
	provider TEXT NOT NULL CHECK (provider IN ('npm', 'jsdelivr')),
	year INTEGER NOT NULL CHECK (year >= 2015),
	total INTEGER NOT NULL CHECK (total >= 0),
	PRIMARY KEY (package_name, provider, year),
	FOREIGN KEY (package_name) REFERENCES stats_packages (package_name) ON DELETE CASCADE
);
