create table wallet_accounts (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,
    balance numeric(14,2) not null default 0,
    version bigint not null default 0,
    updated_at timestamptz not null default now()
);

create table wallet_transactions (
    id bigserial primary key,
    wallet_id bigint not null references wallet_accounts(id) on delete cascade,
    type varchar(20) not null,
    amount numeric(14,2) not null,
    balance_after numeric(14,2) not null,
    note varchar(500),
    created_at timestamptz not null default now()
);
create index idx_wallet_transactions_wallet on wallet_transactions(wallet_id, created_at desc);
