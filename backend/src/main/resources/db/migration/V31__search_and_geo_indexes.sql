-- Job search runs `lower(title) like '%...%'` (and the same on description), which no b-tree index
-- can serve — every search was a sequential scan over the whole table. A trigram index makes the
-- leading-wildcard match indexable.
create extension if not exists pg_trgm;

create index idx_jobs_title_trgm on jobs using gin (lower(title) gin_trgm_ops);
create index idx_jobs_description_trgm on jobs using gin (lower(description) gin_trgm_ops);

-- Worker search matches on name the same way.
create index idx_worker_profiles_name_trgm on worker_profiles
    using gin ((lower(first_name) || ' ' || lower(last_name)) gin_trgm_ops);

-- Map screens filter on "has coordinates" and will filter on a bounding box; a composite index over
-- the pair serves both. Partial, because most rows have no coordinates at all.
create index idx_jobs_coordinates on jobs(latitude, longitude)
    where latitude is not null and longitude is not null;
create index idx_worker_profiles_coordinates on worker_profiles(latitude, longitude)
    where latitude is not null and longitude is not null;
create index idx_employer_profiles_coordinates on employer_profiles(latitude, longitude)
    where latitude is not null and longitude is not null;
