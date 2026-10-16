create extension if not exists citext;

create table admins (
    id            uuid        primary key default gen_random_uuid(),
    name          text        not null,
    email         citext      not null unique,   
    password_hash text        not null,          
    created_at    timestamptz not null default now()
);

create table repositories (
    id            uuid        primary key default gen_random_uuid(),
    name          text        not null,
    package_name text[] not null check (cardinality(package_name) > 0),          
    uri           text        not null,         
    suite         text        not null,         
    component     text        not null,         
    architecture  text        not null default 'amd64',
    signedBy       text        not null,         
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),

    unique (uri, suite, component, architecture),
    check (uri ~ '^https?://' and uri !~ '/$')
);


create type application_status as enum ('draft', 'live');

create table applications (
    id             uuid        primary key default gen_random_uuid(),
    repository_id  uuid        not null references repositories(id) on delete restrict,
    display_name   text,                        
    package_name   text        not null,        
    description    text,
    version        text        not null,
    has_icon      boolean,
    images         text[]      not null default '{}' check (cardinality(images) <= 5),
    download_size_bytes  bigint not null CHECK (download_size_bytes >= 0),
    installed_size_bytes bigint not null CHECK (installed_size_bytes >= 0),
    category       text,
    homepage       text,
    maintainer     text,                          
    status         application_status not null default 'draft',
    missing_since  timestamptz,                 
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (repository_id, package_name)        

);

create index applications_status_idx on applications (status);

create type sync_status as enum ('running', 'success', 'failed');

create table sync_logs (
    id              uuid        primary key default gen_random_uuid(),
    repository_id   uuid        not null references repositories(id) on delete cascade,
    status          sync_status not null default 'running',
    started_at      timestamptz not null default now(),
    finished_at     timestamptz,                 
    packages_found  integer,                     
    error           text,                        
    check ((status = 'running') = (finished_at is null))
);

create unique index one_running_sync_per_repo
    on sync_logs (repository_id) where status = 'running';

