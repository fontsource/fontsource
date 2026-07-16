CREATE INDEX stats_packages_active_family_id
ON stats_packages (family_id)
WHERE active = 1;
