-- Ratings, which only become possible now that job_applications records who worked with whom.
-- A rating is always tied to one job and one pair of people, so it cannot be left by a stranger.
create table ratings (
    id bigserial primary key,
    job_id bigint not null references jobs(id) on delete cascade,
    rater_id bigint not null references users(id) on delete cascade,
    ratee_id bigint not null references users(id) on delete cascade,
    score smallint not null check (score between 1 and 5),
    comment varchar(500),
    created_at timestamptz not null default now(),
    -- One rating per direction per job: an employer rates the worker they hired, and vice versa.
    unique (job_id, rater_id, ratee_id)
);

create index idx_ratings_ratee on ratings(ratee_id, created_at desc);

-- Denormalised so a worker list or shortlist does not aggregate ratings per row. Recomputed
-- whenever a rating is written, inside the same transaction.
alter table worker_profiles
    add column rating_average numeric(3, 2),
    add column rating_count integer not null default 0,
    -- Set by an admin after checking documents. A worker in a market with no trust infrastructure
    -- has nothing else to show; this is the one signal the platform can vouch for.
    add column verified boolean not null default false,
    add column verified_at timestamptz;

alter table employer_profiles
    add column rating_average numeric(3, 2),
    add column rating_count integer not null default 0;
