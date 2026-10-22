CREATE EXTENSION IF NOT EXISTS citext;

-- Keeps updated_at values consistent whenever a row is modified.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE if not exists admins (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         CITEXT       NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TYPE application_source_type AS ENUM ('repository');
CREATE TYPE application_status      AS ENUM ('draft', 'published');


CREATE TABLE applications (
    id                      UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name            VARCHAR(100)            NOT NULL,
    source_type             application_source_type NOT NULL,
    version                 VARCHAR(100)            NOT NULL,
    maintainer              VARCHAR(255),
    caption                 VARCHAR(150),
    description             TEXT,
    icon_updated_at         TIMESTAMPTZ,
    images                  TEXT[]                  NOT NULL DEFAULT '{}'::TEXT[],
    category                VARCHAR(50),
    homepage_uri            VARCHAR(512),
    download_size_in_bytes  BIGINT                  NOT NULL,
    installed_size_in_bytes BIGINT                  NOT NULL,
    status                  application_status      NOT NULL DEFAULT 'draft',
    created_at              TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ             NOT NULL DEFAULT now(),

    CONSTRAINT applications_download_size_nonneg
        CHECK (download_size_in_bytes >= 0),
    CONSTRAINT applications_installed_size_nonneg
        CHECK (installed_size_in_bytes >= 0),

    CONSTRAINT applications_images_count
        CHECK (
            cardinality(images) = 0
            OR cardinality(images) = 5
        );,

    -- Drafts may be incomplete; published applications must have publishable metadata.
    CONSTRAINT applications_live_requires_complete
        CHECK (
            status = 'draft'
            OR (
                maintainer  IS NOT NULL
                AND caption         IS NOT NULL
                AND description IS NOT NULL
                AND category    IS NOT NULL
                AND icon_updated_at IS NOT NULL
                AND images      IS NOT NULL
                AND homepage_uri    IS NOT NULL
                AND download_size_in_bytes IS NOT NULL
                AND installed_size_in_bytes IS NOT NULL
            )
        )
);

CREATE INDEX applications_status_idx
    ON applications (status);
CREATE TRIGGER applications_set_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE repositories (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID          NOT NULL UNIQUE
                                 REFERENCES applications(id) ON DELETE CASCADE,
    package_name   VARCHAR(100)  NOT NULL,
    uri            VARCHAR(512) NOT NULL,
    suite          VARCHAR(100)  NOT NULL,
    component      VARCHAR(50)   NOT NULL,
    key_uri        VARCHAR(512) NOT NULL,
    key_content    TEXT          NOT NULL,
    fingerprint    VARCHAR(64)   NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT repositories_repo_unique UNIQUE (uri, suite, component),

    -- https only, no trailing slash
    CONSTRAINT repositories_uri_format
        CHECK (uri ~ '^https://' AND uri !~ '/$'),
    CONSTRAINT repositories_key_uri_format
        CHECK (key_uri ~ '^https://' AND key_uri !~ '/$'),

    -- uppercase hex, 40 chars (v4) or 64 chars (v5/v6); service normalizes first
    CONSTRAINT repositories_fingerprint_format
        CHECK (fingerprint ~ '^([0-9A-F]{40}|[0-9A-F]{64})$')
);

CREATE TRIGGER repositories_set_updated_at
    BEFORE UPDATE ON repositories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
